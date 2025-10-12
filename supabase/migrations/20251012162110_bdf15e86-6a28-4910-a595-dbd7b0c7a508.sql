-- Add user_id column to simulations table
ALTER TABLE public.simulations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id required for new rows (existing rows can be null temporarily)
-- We'll update existing rows to have a user_id or they'll need to be cleaned up

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on simulations" ON public.simulations;

-- Create user-specific RLS policies for simulations
CREATE POLICY "Users can view their own simulations" 
ON public.simulations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own simulations" 
ON public.simulations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simulations" 
ON public.simulations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simulations" 
ON public.simulations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix simulation_responses table as well
ALTER TABLE public.simulation_responses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow all operations on responses" ON public.simulation_responses;

CREATE POLICY "Users can view their own responses" 
ON public.simulation_responses 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.simulations WHERE id = simulation_id
  )
);

CREATE POLICY "Users can create responses for their simulations" 
ON public.simulation_responses 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.simulations WHERE id = simulation_id
  )
);

-- Fix simulation_violations table as well
ALTER TABLE public.simulation_violations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow all operations on violations" ON public.simulation_violations;

CREATE POLICY "Users can view their own violations" 
ON public.simulation_violations 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.simulations WHERE id = simulation_id
  )
);

CREATE POLICY "System can create violations for user simulations" 
ON public.simulation_violations 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.simulations WHERE id = simulation_id
  )
);