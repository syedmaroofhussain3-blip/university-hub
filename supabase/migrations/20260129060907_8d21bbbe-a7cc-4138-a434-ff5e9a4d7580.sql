-- Add logo_url to teams table
ALTER TABLE public.teams ADD COLUMN logo_url TEXT;

-- Remove payment columns from events (optional - keeping for reference but unused)
-- We'll keep the columns but the feature will be disabled in UI