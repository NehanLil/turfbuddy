-- Add geolocation columns for location-based filtering in India
ALTER TABLE public.game_plans
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'IN';

-- Optional: ensure country code is two letters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_country_code_len'
  ) THEN
    ALTER TABLE public.game_plans
      ADD CONSTRAINT chk_country_code_len CHECK (country_code IS NULL OR char_length(country_code) = 2);
  END IF;
END $$;

-- Indexes for faster nearby and city searches
CREATE INDEX IF NOT EXISTS idx_game_plans_lat_lng ON public.game_plans(lat, lng);
CREATE INDEX IF NOT EXISTS idx_game_plans_city ON public.game_plans(city);

