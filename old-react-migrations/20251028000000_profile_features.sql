-- Create tables for profile features: ratings, saved players, reliability tracking

-- 1. User Ratings Table
CREATE TABLE IF NOT EXISTS user_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rated_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rater_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES game_plans(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  category VARCHAR(50) CHECK (category IN ('organizer', 'participant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rated_user_id, rater_user_id, plan_id)
);

-- 2. Saved Players Table

CREATE TABLE IF NOT EXISTS saved_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  saved_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, saved_user_id)
);

-- 3. Plan Cancellations Table (for reliability tracking)
CREATE TABLE IF NOT EXISTS plan_cancellations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES game_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('organizer', 'participant')),
  reason TEXT,
  cancelled_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  chat_style VARCHAR(50),
  music_preference VARCHAR(50),
  smoking_preference VARCHAR(50),
  other_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to profiles if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_plans_organized INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_plans_participated INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plans_cancelled_as_organizer INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plans_cancelled_as_participant INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated_user ON user_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rater_user ON user_ratings(rater_user_id);
CREATE INDEX IF NOT EXISTS idx_saved_players_user ON saved_players(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_players_saved_user ON saved_players(saved_user_id);
CREATE INDEX IF NOT EXISTS idx_plan_cancellations_user ON plan_cancellations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- RLS Policies for user_ratings
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings"
ON user_ratings FOR SELECT
USING (true);

CREATE POLICY "Users can create ratings"
ON user_ratings FOR INSERT
WITH CHECK (auth.uid() = rater_user_id);

CREATE POLICY "Users can update their own ratings"
ON user_ratings FOR UPDATE
USING (auth.uid() = rater_user_id)
WITH CHECK (auth.uid() = rater_user_id);

-- RLS Policies for saved_players
ALTER TABLE saved_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved players"
ON saved_players FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save players"
ON saved_players FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved players"
ON saved_players FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for plan_cancellations
ALTER TABLE plan_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cancellations"
ON plan_cancellations FOR SELECT
USING (true);

CREATE POLICY "Users can record cancellations"
ON plan_cancellations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their preferences"
ON user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to calculate reliability
CREATE OR REPLACE FUNCTION calculate_reliability(user_uuid UUID, user_role VARCHAR)
RETURNS TEXT AS $$
DECLARE
  total_plans INTEGER;
  cancelled_plans INTEGER;
  cancel_rate DECIMAL;
BEGIN
  IF user_role = 'organizer' THEN
    SELECT total_plans_organized, plans_cancelled_as_organizer
    INTO total_plans, cancelled_plans
    FROM profiles WHERE id = user_uuid;
  ELSE
    SELECT total_plans_participated, plans_cancelled_as_participant
    INTO total_plans, cancelled_plans
    FROM profiles WHERE id = user_uuid;
  END IF;

  IF total_plans = 0 THEN
    RETURN 'No history yet';
  END IF;

  cancel_rate := (cancelled_plans::DECIMAL / total_plans::DECIMAL) * 100;

  IF cancel_rate = 0 THEN
    RETURN 'Never cancels bookings';
  ELSIF cancel_rate < 10 THEN
    RETURN 'Rarely cancels bookings';
  ELSIF cancel_rate < 25 THEN
    RETURN 'Sometimes cancels bookings';
  ELSE
    RETURN 'Frequently cancels bookings';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update average rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM user_ratings
      WHERE rated_user_id = NEW.rated_user_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM user_ratings
      WHERE rated_user_id = NEW.rated_user_id
    ),
    updated_at = NOW()
  WHERE id = NEW.rated_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating on insert/update
DROP TRIGGER IF EXISTS trigger_update_user_rating ON user_ratings;
CREATE TRIGGER trigger_update_user_rating
AFTER INSERT OR UPDATE ON user_ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();

