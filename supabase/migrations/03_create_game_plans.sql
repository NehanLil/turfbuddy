-- Migration 3: Create Game Plans and Related Tables

CREATE TABLE game_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sport sport_type NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  city TEXT,
  country_code TEXT,
  max_players INTEGER NOT NULL,
  current_players INTEGER DEFAULT 1,
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  status plan_status DEFAULT 'open',
  organizer_id UUID NOT NULL,
  group_id UUID,
  public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_game_plans_organizer FOREIGN KEY (organizer_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_game_plans_group FOREIGN KEY (group_id) 
    REFERENCES groups(id) ON DELETE SET NULL
);

CREATE TABLE plan_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  user_id UUID NOT NULL,
  has_paid BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_plan_participants_plan FOREIGN KEY (plan_id) 
    REFERENCES game_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_participants_user FOREIGN KEY (user_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE,
  UNIQUE(plan_id, user_id)
);

CREATE TABLE join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status request_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_join_requests_plan FOREIGN KEY (plan_id) 
    REFERENCES game_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_join_requests_user FOREIGN KEY (user_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE,
  UNIQUE(plan_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_messages_plan FOREIGN KEY (plan_id) 
    REFERENCES game_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_user FOREIGN KEY (user_id) 
    REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE game_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Game Plans RLS Policies
CREATE POLICY "Public plans are viewable by everyone"
  ON game_plans FOR SELECT
  USING (
    public = true 
    OR organizer_id = auth.uid() 
    OR id IN (
      SELECT plan_id FROM plan_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create game plans"
  ON game_plans FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their plans"
  ON game_plans FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their plans"
  ON game_plans FOR DELETE
  USING (auth.uid() = organizer_id);

-- Plan Participants RLS Policies
CREATE POLICY "Users can view participants of public plans or their plans"
  ON plan_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR plan_id IN (
      SELECT id FROM game_plans 
      WHERE public = true OR organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can add participants"
  ON plan_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_plans 
      WHERE game_plans.id = plan_participants.plan_id 
      AND game_plans.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update participants"
  ON plan_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_plans 
      WHERE game_plans.id = plan_participants.plan_id 
      AND game_plans.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave plans"
  ON plan_participants FOR DELETE
  USING (auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM game_plans 
      WHERE game_plans.id = plan_participants.plan_id 
      AND game_plans.organizer_id = auth.uid()
    )
  );

-- Join Requests RLS Policies
CREATE POLICY "Users can view join requests for their plans"
  ON join_requests FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM game_plans 
      WHERE game_plans.id = join_requests.plan_id 
      AND game_plans.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Users can create join requests"
  ON join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can update join requests"
  ON join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_plans 
      WHERE game_plans.id = join_requests.plan_id 
      AND game_plans.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own requests"
  ON join_requests FOR DELETE
  USING (auth.uid() = user_id);

-- Messages RLS Policies
CREATE POLICY "Users can view messages from plans they're part of"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plan_participants 
      WHERE plan_participants.plan_id = messages.plan_id 
      AND plan_participants.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM game_plans 
      WHERE game_plans.id = messages.plan_id 
      AND game_plans.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM plan_participants 
      WHERE plan_participants.plan_id = messages.plan_id 
      AND plan_participants.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM game_plans 
      WHERE game_plans.id = messages.plan_id 
      AND game_plans.organizer_id = auth.uid()
    )) AND auth.uid() = user_id
  );

-- Triggers
CREATE TRIGGER update_game_plans_updated_at
  BEFORE UPDATE ON game_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_join_requests_updated_at
  BEFORE UPDATE ON join_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-add organizer as participant
CREATE OR REPLACE FUNCTION add_organizer_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO plan_participants (plan_id, user_id, has_paid)
  VALUES (NEW.id, NEW.organizer_id, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_game_plan_created
  AFTER INSERT ON game_plans
  FOR EACH ROW EXECUTE FUNCTION add_organizer_as_participant();

-- Update current_players count
CREATE OR REPLACE FUNCTION update_current_players()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE game_plans 
    SET current_players = (
      SELECT COUNT(*) FROM plan_participants 
      WHERE plan_id = NEW.plan_id
    )
    WHERE id = NEW.plan_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE game_plans 
    SET current_players = (
      SELECT COUNT(*) FROM plan_participants 
      WHERE plan_id = OLD.plan_id
    )
    WHERE id = OLD.plan_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_participant_change
  AFTER INSERT OR DELETE ON plan_participants
  FOR EACH ROW EXECUTE FUNCTION update_current_players();
