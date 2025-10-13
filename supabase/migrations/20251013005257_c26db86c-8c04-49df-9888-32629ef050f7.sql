-- Add violations_count column to simulations table
ALTER TABLE public.simulations 
ADD COLUMN violations_count integer NOT NULL DEFAULT 0;

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

-- Create trigger to auto-increment violations count
CREATE TRIGGER on_violation_created
  AFTER INSERT ON simulation_violations
  FOR EACH ROW
  EXECUTE FUNCTION increment_simulation_violations();