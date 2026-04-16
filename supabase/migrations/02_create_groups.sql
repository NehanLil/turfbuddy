-- Migration 2: Create Groups and Group Members Tables

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES profiles(user_id) ON DELETE CASCADE
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) 
    REFERENCES groups(id) ON DELETE CASCADE,
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT group_messages_group_id_fkey FOREIGN KEY (group_id) 
    REFERENCES groups(id) ON DELETE CASCADE,
  CONSTRAINT group_messages_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Groups RLS Policies
CREATE POLICY "Users can view groups they are members of"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = groups.id 
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups"
  ON groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = groups.id 
      AND group_members.user_id = auth.uid() 
      AND group_members.is_admin = true
    )
  );

CREATE POLICY "Group admins can delete groups"
  ON groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = groups.id 
      AND group_members.user_id = auth.uid() 
      AND group_members.is_admin = true
    )
  );

-- Group Members RLS Policies
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can add members"
  ON group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.is_admin = true
    )
  );

CREATE POLICY "Group admins can remove members"
  ON group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.is_admin = true
    )
  );

-- Group Messages RLS Policies
CREATE POLICY "Users can view messages in their groups"
  ON group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = group_messages.group_id 
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON group_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = group_messages.group_id 
      AND group_members.user_id = auth.uid()
    ) AND auth.uid() = user_id
  );

-- Triggers
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-add creator as admin when group is created
CREATE OR REPLACE FUNCTION add_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, is_admin)
  VALUES (NEW.id, NEW.created_by, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_created
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION add_creator_as_admin();
