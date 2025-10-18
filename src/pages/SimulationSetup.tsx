import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const SimulationSetup = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!jobDescription.trim() || !companyDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both job and company descriptions",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Generate the simulation scenario
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generate-simulation',
        {
          body: {
            jobDescription: jobDescription.trim(),
            companyDescription: companyDescription.trim(),
          },
        }
      );

      if (functionError) throw functionError;

      // Save the simulation to the database
      const { data: simulation, error: dbError } = await supabase
        .from('simulations')
        .insert({
          job_description: jobDescription.trim(),
          company_description: companyDescription.trim(),
          generated_scenario: functionData.scenario,
          user_id: null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Simulation generated!",
        description: "Your personalized hiring simulation is ready.",
      });

      // Navigate to the simulation
      navigate(`/simulation/${simulation.id}`);
    } catch (error) {
      console.error('Error generating simulation:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate simulation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Simulation</h1>
          <p className="text-muted-foreground">
            Provide details about the role and company to generate a personalized hiring simulation
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="job-description">Job Role Description</Label>
            <Textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="E.g., Software Engineer Intern focusing on backend development, working with Python and PostgreSQL..."
              className="min-h-[150px] resize-none"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-description">Company Description</Label>
            <Textarea
              id="company-description"
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              placeholder="E.g., Fast-growing fintech startup building payment infrastructure for SMBs. Team of 15, Series A funded..."
              className="min-h-[150px] resize-none"
              disabled={isGenerating}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Simulation...
              </>
            ) : (
              "Start Simulation"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SimulationSetup;
