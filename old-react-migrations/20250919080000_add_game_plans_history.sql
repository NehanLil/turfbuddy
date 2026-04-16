-- History table for archived game plans (past games)
CREATE TABLE IF NOT EXISTS public.game_plans_history (
  id UUID PRIMARY KEY,
  organizer_id UUID NOT NULL,
  sport public.sport_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  city TEXT,
  country_code TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  total_cost INTEGER NOT NULL,
  max_players INTEGER NOT NULL,
  current_players INTEGER,
  status public.plan_status,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Basic index for common lookups
CREATE INDEX IF NOT EXISTS idx_game_plans_history_date ON public.game_plans_history(date);
CREATE INDEX IF NOT EXISTS idx_game_plans_history_city ON public.game_plans_history(city);

-- Archival function: moves past-dated plans into history
CREATE OR REPLACE FUNCTION public.archive_old_game_plans()
RETURNS void AS $$
BEGIN
  WITH moved AS (
    DELETE FROM public.game_plans gp
    WHERE gp.date < CURRENT_DATE
    RETURNING gp.*
  )
  INSERT INTO public.game_plans_history (
    id, organizer_id, sport, title, description, location, lat, lng, city, country_code,
    date, time, total_cost, max_players, current_players, status, created_at, updated_at
  )
  SELECT
    id, organizer_id, sport, title, description, location, lat, lng, city, country_code,
    date, time, total_cost, max_players, current_players, status, created_at, updated_at
  FROM moved;
END;
$$ LANGUAGE plpgsql;


