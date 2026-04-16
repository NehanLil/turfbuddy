-- Migration 8: Fix RLS Policies and Foreign Keys

-- Create a function to check if user is a participant (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION is_plan_participant(plan_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM plan_participants 
    WHERE plan_id = plan_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fix infinite recursion in game_plans policy
DROP POLICY IF EXISTS "Public plans are viewable by everyone" ON game_plans;

CREATE POLICY "Public plans are viewable by everyone"
  ON game_plans FOR SELECT
  USING (
    public = true 
    OR organizer_id = auth.uid() 
    OR is_plan_participant(id, auth.uid())
  );

-- Fix plan_participants policy to use the function
DROP POLICY IF EXISTS "Users can view participants of public plans or their plans" ON plan_participants;

CREATE POLICY "Users can view participants of public plans or their plans"
  ON plan_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_plan_participant(plan_id, auth.uid())
  );

-- Fix dm_conversations foreign keys (use PostgREST naming convention)
ALTER TABLE dm_conversations DROP CONSTRAINT IF EXISTS fk_dm_conversations_user1;
ALTER TABLE dm_conversations DROP CONSTRAINT IF EXISTS fk_dm_conversations_user2;
ALTER TABLE dm_conversations DROP CONSTRAINT IF EXISTS fk_dm_conversations_message;
ALTER TABLE dm_conversations DROP CONSTRAINT IF EXISTS dm_conversations_user1_id_fkey;
ALTER TABLE dm_conversations DROP CONSTRAINT IF EXISTS dm_conversations_user2_id_fkey;
ALTER TABLE dm_conversations DROP CONSTRAINT IF EXISTS dm_conversations_last_message_id_fkey;

ALTER TABLE dm_conversations 
  ADD CONSTRAINT dm_conversations_user1_id_fkey 
  FOREIGN KEY (user1_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE dm_conversations 
  ADD CONSTRAINT dm_conversations_user2_id_fkey 
  FOREIGN KEY (user2_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE dm_conversations 
  ADD CONSTRAINT dm_conversations_last_message_id_fkey 
  FOREIGN KEY (last_message_id) REFERENCES direct_messages(id) ON DELETE SET NULL;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Add missing quiz_seen column if not exists
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS quiz_seen BOOLEAN DEFAULT FALSE;
