-- Fix user_preferences foreign key constraint issue
-- The problem: user_preferences references profiles(id) but profile might not exist yet

-- Step 1: Create or update profiles table to ensure it has proper constraints
-- Make sure profiles.id matches auth.users.id
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Step 2: Create function to ensure profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists_for_user(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Try to get existing profile
  SELECT id INTO profile_id FROM profiles WHERE user_id = user_uuid OR id = user_uuid LIMIT 1;
  
  -- If no profile exists, create one
  IF profile_id IS NULL THEN
    INSERT INTO profiles (id, user_id, created_at, updated_at)
    VALUES (user_uuid, user_uuid, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO profile_id;
  END IF;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger function for user_preferences
CREATE OR REPLACE FUNCTION ensure_profile_before_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure profile exists
  PERFORM ensure_profile_exists_for_user(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger function for saved_players
CREATE OR REPLACE FUNCTION ensure_profiles_before_save()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure both user and saved_user profiles exist
  PERFORM ensure_profile_exists_for_user(NEW.user_id);
  PERFORM ensure_profile_exists_for_user(NEW.saved_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger function for user_ratings
CREATE OR REPLACE FUNCTION ensure_profiles_before_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure both rater and rated user profiles exist
  PERFORM ensure_profile_exists_for_user(NEW.rater_id);
  PERFORM ensure_profile_exists_for_user(NEW.rated_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create triggers for all tables
DROP TRIGGER IF EXISTS ensure_profile_before_preferences ON user_preferences;
CREATE TRIGGER ensure_profile_before_preferences
  BEFORE INSERT OR UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profile_before_preferences();

DROP TRIGGER IF EXISTS ensure_profiles_before_save ON saved_players;
CREATE TRIGGER ensure_profiles_before_save
  BEFORE INSERT OR UPDATE ON saved_players
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profiles_before_save();

DROP TRIGGER IF EXISTS ensure_profiles_before_rating ON user_ratings;
CREATE TRIGGER ensure_profiles_before_rating
  BEFORE INSERT OR UPDATE ON user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profiles_before_rating();

-- Step 7: Update RLS policies for user_preferences to work with auth.uid()
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 8: Ensure RLS is enabled on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

