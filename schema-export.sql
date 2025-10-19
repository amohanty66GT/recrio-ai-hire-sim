-- Simulations Schema Export
-- This file contains the complete database schema for your simulation application

-- Create simulations table
CREATE TABLE IF NOT EXISTS public.simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  job_description TEXT NOT NULL,
  company_description TEXT NOT NULL,
  generated_scenario JSONB NOT NULL,
  status TEXT DEFAULT 'in_progress',
  violations_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create simulation_responses table
CREATE TABLE IF NOT EXISTS public.simulation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID,
  user_id UUID,
  question_id TEXT NOT NULL,
  response TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create simulation_violations table
CREATE TABLE IF NOT EXISTS public.simulation_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID,
  user_id UUID,
  violation_type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for simulations table
CREATE POLICY "Anyone can view simulations" 
  ON public.simulations FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create simulations" 
  ON public.simulations FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update simulations" 
  ON public.simulations FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete simulations" 
  ON public.simulations FOR DELETE 
  USING (true);

-- RLS Policies for simulation_responses table
CREATE POLICY "Anyone can view responses" 
  ON public.simulation_responses FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create responses" 
  ON public.simulation_responses FOR INSERT 
  WITH CHECK (true);

-- RLS Policies for simulation_violations table
CREATE POLICY "Anyone can view violations" 
  ON public.simulation_violations FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create violations" 
  ON public.simulation_violations FOR INSERT 
  WITH CHECK (true);

-- Create function to increment violations count
CREATE OR REPLACE FUNCTION public.increment_simulation_violations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE simulations 
  SET violations_count = violations_count + 1
  WHERE id = NEW.simulation_id;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically increment violations count
CREATE TRIGGER on_violation_insert
  AFTER INSERT ON public.simulation_violations
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_simulation_violations();
