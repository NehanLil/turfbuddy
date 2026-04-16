-- Migration 5: Add Profile Features (Ratings, Saved Players, Preferences)

-- 1. User Ratings Table
CREATE TABLE user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rated_user_id UUID NOT NULL,
  rater_user_id UUID NOT NULL,
  plan_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  category VARCHAR(50) CHECK (category IN ('organizer', 'participant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user_ratings_rated FOREIGN KEY (rated_user_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_ratings_rater FOREIGN KEY (rater_user_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_ratings_plan FOREIGN KEY (plan_id) 
    REFERENCES game_plans(id) ON DELETE CASCADE,
  UNIQUE(rated_user_id, rater_user_id, plan_id)
);

-- 2. Saved Players Table
CREATE TABLE saved_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  saved_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_saved_players_user FOREIGN KEY (user_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_players_saved FOREIGN KEY (saved_user_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE,
  UNIQUE(user_id, saved_user_id)
);

-- 3. Plan Cancellations Table (for reliability tracking)
CREATE TABLE plan_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(20) CHECK (role IN ('organizer', 'participant')),
  reason TEXT,
  cancelled_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_plan_cancellations_plan FOREIGN KEY (plan_id) 
    REFERENCES game_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_cancellations_user FOREIGN KEY (user_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- 4. User Preferences Table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  bio TEXT,
  chat_style VARCHAR(100),
  music_preference VARCHAR(100),
  smoking_preference VARCHAR(100),
  sports_preference VARCHAR(100),
  preferences_completed BOOLEAN DEFAULT FALSE,
  quiz_seen BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT TRUE,
  other_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Add columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_plans_organized INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_plans_participated INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plans_cancelled_as_organizer INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plans_cancelled_as_participant INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX idx_user_ratings_rated_user ON user_ratings(rated_user_id);
CREATE INDEX idx_user_ratings_rater_user ON user_ratings(rater_user_id);
CREATE INDEX idx_saved_players_user ON saved_players(user_id);
CREATE INDEX idx_saved_players_saved_user ON saved_players(saved_user_id);
CREATE INDEX idx_plan_cancellations_user ON plan_cancellations(user_id);
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_ratings
CREATE POLICY "Users can view ratings"
  ON user_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings"
  ON user_ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_user_id);

CREATE POLICY "Users can update their own ratings"
  ON user_ratings FOR UPDATE
  USING (auth.uid() = rater_user_id);

-- RLS Policies for saved_players
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
CREATE POLICY "Users can view cancellations"
  ON plan_cancellations FOR SELECT
  USING (true);

CREATE POLICY "Users can record cancellations"
  ON plan_cancellations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

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
  WHERE user_id = NEW.rated_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update rating on insert/update
CREATE TRIGGER trigger_update_user_rating
  AFTER INSERT OR UPDATE ON user_ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- Trigger for updated_at
CREATE TRIGGER update_user_ratings_updated_at
  BEFORE UPDATE ON user_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
