-- Migration 9: Enable Realtime on All Tables

-- Add all relevant tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

-- Tables already added in previous migrations:
-- game_plans, messages, plan_participants, join_requests, group_messages, profiles

-- Verify realtime is enabled:
-- SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename;

-- Expected tables in realtime:
-- 1. direct_messages
-- 2. dm_conversations
-- 3. game_plans
-- 4. group_members
-- 5. group_messages
-- 6. groups
-- 7. join_requests
-- 8. messages
-- 9. plan_participants
-- 10. profiles
