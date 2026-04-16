-- Add groups and group membership
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Add group_id to game_plans for group-linked plans
ALTER TABLE public.game_plans ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

-- Group chat messages
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Game plan posted as message in group
-- (Handled in app logic: when a plan is created for a group, insert a message in group_messages)

-- Enable RLS and basic policies for groups and group_members
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their groups" ON public.groups FOR SELECT USING (
  id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Members can view group members" ON public.group_members FOR SELECT USING (
  user_id = auth.uid() OR group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Members can view group messages" ON public.group_messages FOR SELECT USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Members can send group messages" ON public.group_messages FOR INSERT WITH CHECK (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()) AND user_id = auth.uid()
);
