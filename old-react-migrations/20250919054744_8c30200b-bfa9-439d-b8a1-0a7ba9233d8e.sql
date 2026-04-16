-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for sports
CREATE TYPE sport_type AS ENUM ('football', 'cricket', 'badminton', 'basketball', 'tennis', 'volleyball', 'table_tennis');

-- Create enum for plan status
CREATE TYPE plan_status AS ENUM ('open', 'full', 'completed', 'cancelled');

-- Create enum for join request status
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  phone_number TEXT,
  college TEXT,
  city TEXT,
  avatar_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_plans table
CREATE TABLE public.game_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL,
  sport sport_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  total_cost INTEGER NOT NULL,
  max_players INTEGER NOT NULL,
  current_players INTEGER DEFAULT 1,
  status plan_status DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create join_requests table
CREATE TABLE public.join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status request_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, user_id)
);

-- Create plan_participants table (approved players)
CREATE TABLE public.plan_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL,
  user_id UUID NOT NULL,
  has_paid BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, user_id)
);

-- Create messages table for chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for game_plans
CREATE POLICY "Users can view all game plans" 
ON public.game_plans FOR SELECT 
USING (true);

CREATE POLICY "Users can create game plans" 
ON public.game_plans FOR INSERT 
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their game plans" 
ON public.game_plans FOR UPDATE 
USING (auth.uid() = organizer_id);

-- Create policies for join_requests
CREATE POLICY "Users can view requests for their plans or their own requests" 
ON public.join_requests FOR SELECT 
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT organizer_id FROM game_plans WHERE id = plan_id)
);

CREATE POLICY "Users can create join requests" 
ON public.join_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can update join requests for their plans" 
ON public.join_requests FOR UPDATE 
USING (auth.uid() IN (SELECT organizer_id FROM game_plans WHERE id = plan_id));

-- Create policies for plan_participants
CREATE POLICY "Users can view participants of all plans" 
ON public.plan_participants FOR SELECT 
USING (true);

CREATE POLICY "Organizers can manage participants" 
ON public.plan_participants FOR ALL 
USING (auth.uid() IN (SELECT organizer_id FROM game_plans WHERE id = plan_id));

-- Create policies for messages
CREATE POLICY "Participants can view messages in their plans" 
ON public.messages FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM plan_participants WHERE plan_id = messages.plan_id
    UNION
    SELECT organizer_id FROM game_plans WHERE id = messages.plan_id
  )
);

CREATE POLICY "Participants can send messages in their plans" 
ON public.messages FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  auth.uid() IN (
    SELECT user_id FROM plan_participants WHERE plan_id = messages.plan_id
    UNION
    SELECT organizer_id FROM game_plans WHERE id = messages.plan_id
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_plans_updated_at
  BEFORE UPDATE ON public.game_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_join_requests_updated_at
  BEFORE UPDATE ON public.join_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email, 'Anonymous User'),
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update current_players count
CREATE OR REPLACE FUNCTION public.update_current_players()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE game_plans 
    SET current_players = (
      SELECT COUNT(*) + 1 FROM plan_participants WHERE plan_id = NEW.plan_id
    )
    WHERE id = NEW.plan_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE game_plans 
    SET current_players = (
      SELECT COUNT(*) + 1 FROM plan_participants WHERE plan_id = OLD.plan_id
    )
    WHERE id = OLD.plan_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update current_players
CREATE TRIGGER update_current_players_on_insert
  AFTER INSERT ON public.plan_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_current_players();

CREATE TRIGGER update_current_players_on_delete
  AFTER DELETE ON public.plan_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_current_players();

-- Add foreign key constraints
ALTER TABLE public.game_plans ADD CONSTRAINT fk_game_plans_organizer 
  FOREIGN KEY (organizer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.join_requests ADD CONSTRAINT fk_join_requests_plan 
  FOREIGN KEY (plan_id) REFERENCES public.game_plans(id) ON DELETE CASCADE;

ALTER TABLE public.join_requests ADD CONSTRAINT fk_join_requests_user 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.plan_participants ADD CONSTRAINT fk_plan_participants_plan 
  FOREIGN KEY (plan_id) REFERENCES public.game_plans(id) ON DELETE CASCADE;

ALTER TABLE public.plan_participants ADD CONSTRAINT fk_plan_participants_user 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.messages ADD CONSTRAINT fk_messages_plan 
  FOREIGN KEY (plan_id) REFERENCES public.game_plans(id) ON DELETE CASCADE;

ALTER TABLE public.messages ADD CONSTRAINT fk_messages_user 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;