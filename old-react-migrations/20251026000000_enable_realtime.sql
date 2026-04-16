-- Enable Realtime for all important tables
-- This allows WebSocket connections to listen for changes

-- Enable realtime on game_plans table
ALTER PUBLICATION supabase_realtime ADD TABLE game_plans;

-- Enable realtime on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime on plan_participants table
ALTER PUBLICATION supabase_realtime ADD TABLE plan_participants;

-- Enable realtime on join_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE join_requests;

-- Enable realtime on profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Optional: Create indexes to improve realtime query performance
CREATE INDEX IF NOT EXISTS idx_messages_plan_id ON messages(plan_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_plans_date ON game_plans(date);
CREATE INDEX IF NOT EXISTS idx_game_plans_status ON game_plans(status);
CREATE INDEX IF NOT EXISTS idx_plan_participants_user_id ON plan_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_participants_plan_id ON plan_participants(plan_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);
CREATE INDEX IF NOT EXISTS idx_join_requests_plan_id ON join_requests(plan_id);

-- Note: This migration should be run in your Supabase SQL Editor
-- Or apply it via: supabase db push


