-- Create simulations table to store simulation configurations
CREATE TABLE public.simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_description TEXT NOT NULL,
  company_description TEXT NOT NULL,
  generated_scenario JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'submitted'))
);

-- Create responses table to store candidate responses
CREATE TABLE public.simulation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  response TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create violations table to track proctoring events
CREATE TABLE public.simulation_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_violations ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now, can be restricted later with auth)
CREATE POLICY "Allow all operations on simulations"
  ON public.simulations
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on responses"
  ON public.simulation_responses
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on violations"
  ON public.simulation_violations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_responses_simulation_id ON public.simulation_responses(simulation_id);
CREATE INDEX idx_violations_simulation_id ON public.simulation_violations(simulation_id);