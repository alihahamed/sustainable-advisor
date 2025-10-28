-- SustainScan Challenges Schema
-- Run this file in your Supabase SQL Editor

-- ================================================
-- CHALLENGES SYSTEM SCHEMA
-- ================================================

-- Enable Row Level Security (RLS) for all tables
-- Note: These are enabled by default in Supabase

-- ================================================
-- TABLE: challenges (predefined challenges)
-- ================================================

CREATE TABLE public.challenges (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('scan_count', 'favourite_count', 'contribution_count', 'eco_score_average')),
  requirement_value NUMERIC NOT NULL, -- Target value (e.g., 5 products, 80% score)
  reward_points INTEGER DEFAULT 10,
  reward_badge TEXT, -- Badge/achievement name
  icon TEXT DEFAULT '🌱',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read challenges
CREATE POLICY "Anyone can read challenges" ON public.challenges
  FOR SELECT USING (true);

-- ================================================
-- TABLE: user_challenges (user progress tracking)
-- ================================================

CREATE TABLE public.user_challenges (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress NUMERIC DEFAULT 0, -- Current progress towards requirement_value
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own challenge progress
CREATE POLICY "Users can read own challenge progress" ON public.user_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge progress" ON public.user_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge progress" ON public.user_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================================
-- TABLE: user_stats (for quick access to aggregated stats)
-- ================================================

CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_scans INTEGER DEFAULT 0,
  total_favourites INTEGER DEFAULT 0,
  total_contributions INTEGER DEFAULT 0,
  average_eco_score NUMERIC DEFAULT 0,
  total_challenge_points INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own stats
CREATE POLICY "Users can read own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON public.user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON public.user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================================
-- SAMPLE CHALLENGES DATA
-- ================================================

INSERT INTO public.challenges (title, description, type, requirement_value, reward_points, icon, sort_order) VALUES
('Eco Scanner', 'Scan 5 sustainable products using the app', 'scan_count', 5, 20, '🔍', 1),
('Sustainability Lover', 'Favourite 3 eco-friendly products', 'favourite_count', 3, 15, '❤️', 2),
('Data Contributor', 'Help improve sustainability data by submitting product information', 'contribution_count', 1, 25, '📝', 3),
('High Scorer', 'Achieve an average eco-score above 80%', 'eco_score_average', 80, 30, '⭐', 4),
('Consistent Scanner', 'Scan products 10 times', 'scan_count', 10, 25, '📱', 5),
('Eco Collection Curator', 'Favourite 10 products', 'favourite_count', 10, 35, '🎁', 6),
('Data Champion', 'Contribute sustainability data 3 times', 'contribution_count', 3, 50, '🏆', 7),
('Perfect Scorer', 'Achieve a perfect eco-score (100)', 'eco_score_average', 100, 100, '🌟', 8);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

CREATE INDEX idx_user_challenges_user_id ON public.user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge_id ON public.user_challenges(challenge_id);
CREATE INDEX idx_user_challenges_completed ON public.user_challenges(completed);
CREATE INDEX idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX idx_challenges_active_sort ON public.challenges(is_active, sort_order);

-- ================================================
-- FUNCTION: Calculate user stats automatically
-- ================================================

CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user stats
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO UPDATE SET
    last_updated = NOW();

  -- Trigger recalculation could be added here
  -- For now, stats will be calculated on-demand in the app

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create user_stats record
CREATE TRIGGER on_user_challenge_insert
  AFTER INSERT ON public.user_challenges
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- ================================================
-- VIEWS (Optional: for easier querying)
-- ================================================

-- View combining challenges with user progress
CREATE VIEW public.user_challenges_with_details AS
SELECT
  uc.id,
  uc.user_id,
  uc.challenge_id,
  c.title,
  c.description,
  c.type,
  c.requirement_value,
  c.reward_points,
  c.reward_badge,
  c.icon,
  uc.progress,
  uc.completed,
  uc.completed_at,
  uc.created_at as started_at,
  CASE
    WHEN uc.completed THEN 100
    ELSE LEAST(100, (uc.progress / c.requirement_value * 100))
  END as progress_percentage
FROM public.user_challenges uc
JOIN public.challenges c ON uc.challenge_id = c.id
WHERE c.is_active = true;

-- ================================================
-- MIGRATION COMPLETE LOG
-- ================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Challenges schema migration completed successfully!';
  RAISE NOTICE 'Tables created: challenges, user_challenges, user_stats';
  RAISE NOTICE 'Sample challenges inserted: 8 challenges';
  RAISE NOTICE 'Indexes and views created';
  RAISE NOTICE 'Row Level Security enabled';
END;
$$;
