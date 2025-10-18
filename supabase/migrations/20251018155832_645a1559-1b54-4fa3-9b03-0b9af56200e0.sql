-- Drop existing RLS policies that require authentication
DROP POLICY IF EXISTS "Users can create their own simulations" ON public.simulations;
DROP POLICY IF EXISTS "Users can view their own simulations" ON public.simulations;
DROP POLICY IF EXISTS "Users can update their own simulations" ON public.simulations;
DROP POLICY IF EXISTS "Users can delete their own simulations" ON public.simulations;

DROP POLICY IF EXISTS "Users can create responses for their simulations" ON public.simulation_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON public.simulation_responses;

DROP POLICY IF EXISTS "System can create violations for user simulations" ON public.simulation_violations;
DROP POLICY IF EXISTS "Users can view their own violations" ON public.simulation_violations;

-- Create public access policies for simulations
CREATE POLICY "Anyone can create simulations" 
ON public.simulations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view simulations" 
ON public.simulations 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update simulations" 
ON public.simulations 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete simulations" 
ON public.simulations 
FOR DELETE 
USING (true);

-- Create public access policies for simulation_responses
CREATE POLICY "Anyone can create responses" 
ON public.simulation_responses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view responses" 
ON public.simulation_responses 
FOR SELECT 
USING (true);

-- Create public access policies for simulation_violations
CREATE POLICY "Anyone can create violations" 
ON public.simulation_violations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view violations" 
ON public.simulation_violations 
FOR SELECT 
USING (true);