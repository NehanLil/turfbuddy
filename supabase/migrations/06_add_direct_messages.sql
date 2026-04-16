-- Migration 6: Add Direct Messages

-- 1. Direct Messages Table
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_direct_messages_sender FOREIGN KEY (sender_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_direct_messages_receiver FOREIGN KEY (receiver_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- 2. DM Conversations (for quick lookup)
CREATE TABLE dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  last_message_id UUID,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK(user1_id < user2_id)
);

-- Add foreign keys with PostgREST naming convention
ALTER TABLE dm_conversations 
  ADD CONSTRAINT dm_conversations_user1_id_fkey 
  FOREIGN KEY (user1_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE dm_conversations 
  ADD CONSTRAINT dm_conversations_user2_id_fkey 
  FOREIGN KEY (user2_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE dm_conversations 
  ADD CONSTRAINT dm_conversations_last_message_id_fkey 
  FOREIGN KEY (last_message_id) REFERENCES direct_messages(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_created ON direct_messages(created_at DESC);
CREATE INDEX idx_dm_conversations_user1 ON dm_conversations(user1_id);
CREATE INDEX idx_dm_conversations_user2 ON dm_conversations(user2_id);

-- Enable RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;

-- RLS for direct_messages
CREATE POLICY "Users can view their own DMs"
  ON direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send DMs"
  ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their sent DMs"
  ON direct_messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS for dm_conversations
CREATE POLICY "Users can view their conversations"
  ON dm_conversations FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations"
  ON dm_conversations FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their conversations"
  ON dm_conversations FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_dm_conversation()
RETURNS TRIGGER AS $$
DECLARE
  conv_user1 UUID;
  conv_user2 UUID;
BEGIN
  -- Ensure consistent ordering
  IF NEW.sender_id < NEW.receiver_id THEN
    conv_user1 := NEW.sender_id;
    conv_user2 := NEW.receiver_id;
  ELSE
    conv_user1 := NEW.receiver_id;
    conv_user2 := NEW.sender_id;
  END IF;

  -- Update or create conversation
  INSERT INTO dm_conversations (user1_id, user2_id, last_message_id, last_message_at)
  VALUES (conv_user1, conv_user2, NEW.id, NEW.created_at)
  ON CONFLICT (user1_id, user2_id) 
  DO UPDATE SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversation
CREATE TRIGGER trigger_update_dm_conversation
  AFTER INSERT ON direct_messages
  FOR EACH ROW EXECUTE FUNCTION update_dm_conversation();

-- Trigger for updated_at
CREATE TRIGGER update_direct_messages_updated_at
  BEFORE UPDATE ON direct_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
