-- Add new columns to events table for registration type and payment
ALTER TABLE public.events
ADD COLUMN registration_type TEXT NOT NULL DEFAULT 'individual' CHECK (registration_type IN ('individual', 'team')),
ADD COLUMN max_team_size INTEGER DEFAULT NULL,
ADD COLUMN min_team_size INTEGER DEFAULT 2,
ADD COLUMN is_paid BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN registration_fee DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN upi_id TEXT DEFAULT NULL,
ADD COLUMN payment_qr_url TEXT DEFAULT NULL;

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  team_code TEXT NOT NULL UNIQUE,
  leader_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams table
CREATE POLICY "Authenticated can read teams"
ON public.teams
FOR SELECT
USING (true);

CREATE POLICY "Users can create teams"
ON public.teams
FOR INSERT
WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Team leaders can update their teams"
ON public.teams
FOR UPDATE
USING (auth.uid() = leader_id);

CREATE POLICY "Team leaders can delete their teams"
ON public.teams
FOR DELETE
USING (auth.uid() = leader_id);

CREATE POLICY "Event creators can manage event teams"
ON public.teams
FOR ALL
USING (EXISTS (
  SELECT 1 FROM events WHERE events.id = teams.event_id AND events.created_by = auth.uid()
));

-- RLS Policies for team_members table
CREATE POLICY "Authenticated can read team members"
ON public.team_members
FOR SELECT
USING (true);

CREATE POLICY "Users can join teams"
ON public.team_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave teams"
ON public.team_members
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Team leaders can manage members"
ON public.team_members
FOR ALL
USING (EXISTS (
  SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.leader_id = auth.uid()
));

CREATE POLICY "Event creators can manage team members"
ON public.team_members
FOR ALL
USING (EXISTS (
  SELECT 1 FROM teams 
  JOIN events ON events.id = teams.event_id 
  WHERE teams.id = team_members.team_id AND events.created_by = auth.uid()
));

-- Create function to generate unique team codes
CREATE OR REPLACE FUNCTION public.generate_team_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6 character alphanumeric code
    new_code := upper(substr(md5(random()::text), 1, 6));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM teams WHERE team_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Create trigger to update updated_at on teams
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();