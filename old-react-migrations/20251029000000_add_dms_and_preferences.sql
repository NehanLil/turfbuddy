-- Add direct messages and enhanced preferences

-- 1. Direct Messages Table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DM Conversations (for quick lookup)
CREATE TABLE IF NOT EXISTS dm_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_id UUID REFERENCES direct_messages(id),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK(user1_id < user2_id) -- Ensure consistent ordering
);

-- Update user_preferences with quiz answers
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS chat_style VARCHAR(100);
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS music_preference VARCHAR(100);
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS smoking_preference VARCHAR(100);
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS sports_preference VARCHAR(100);
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS preferences_completed BOOLEAN DEFAULT FALSE;

-- Communication preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT FALSE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT TRUE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_user1 ON dm_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_user2 ON dm_conversations(user2_id);

-- RLS for direct_messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own DMs"
ON direct_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send DMs"
ON direct_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their sent DMs"
ON direct_messages FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- RLS for dm_conversations
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
ON dm_conversations FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations"
ON dm_conversations FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

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
$$ LANGUAGE plpgsql;

-- Trigger to update conversation
DROP TRIGGER IF EXISTS trigger_update_dm_conversation ON direct_messages;
CREATE TRIGGER trigger_update_dm_conversation
AFTER INSERT ON direct_messages
FOR EACH ROW
EXECUTE FUNCTION update_dm_conversation();

-- Enable realtime for DMs
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_conversations;

