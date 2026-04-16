-- Migration 4: Enable Realtime and Create Indexes

-- Create indexes for better performance
CREATE INDEX idx_game_plans_date ON game_plans(date);
CREATE INDEX idx_game_plans_sport ON game_plans(sport);
CREATE INDEX idx_game_plans_status ON game_plans(status);
CREATE INDEX idx_game_plans_organizer ON game_plans(organizer_id);
CREATE INDEX idx_game_plans_location ON game_plans(lat, lng);

CREATE INDEX idx_plan_participants_plan ON plan_participants(plan_id);
CREATE INDEX idx_plan_participants_user ON plan_participants(user_id);

CREATE INDEX idx_join_requests_plan ON join_requests(plan_id);
CREATE INDEX idx_join_requests_user ON join_requests(user_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);

CREATE INDEX idx_messages_plan ON messages(plan_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

CREATE INDEX idx_group_messages_group ON group_messages(group_id);
CREATE INDEX idx_group_messages_created ON group_messages(created_at DESC);

-- Enable realtime for tables (this is a SQL command, but you'll also need to enable in dashboard)
-- The actual realtime enabling is done in the Supabase Dashboard under Database > Replication
-- But we can prepare the publication
ALTER PUBLICATION supabase_realtime ADD TABLE game_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE plan_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE join_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Grant access to authenticated users
GRANT SELECT ON game_plans TO authenticated;
GRANT SELECT ON messages TO authenticated;
GRANT SELECT ON plan_participants TO authenticated;
GRANT SELECT ON join_requests TO authenticated;
GRANT SELECT ON groups TO authenticated;
GRANT SELECT ON group_members TO authenticated;
GRANT SELECT ON group_messages TO authenticated;
GRANT SELECT ON profiles TO authenticated;

-- Grant insert/update/delete based on RLS policies
GRANT INSERT, UPDATE, DELETE ON game_plans TO authenticated;
GRANT INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT INSERT, UPDATE, DELETE ON plan_participants TO authenticated;
GRANT INSERT, UPDATE, DELETE ON join_requests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON groups TO authenticated;
GRANT INSERT, UPDATE, DELETE ON group_members TO authenticated;
GRANT INSERT, UPDATE, DELETE ON group_messages TO authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;
