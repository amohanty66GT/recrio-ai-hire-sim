import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, simulationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a strict proctoring system analyzing exam surveillance footage.
Analyze this image and detect ANY of these violations:

1. MULTIPLE PEOPLE: More than one person visible in the frame
2. LOOKING AWAY: Person's face not oriented toward the camera/screen (head turned significantly to side, looking down at lap, etc.)
3. NO PERSON: No person detected in frame at all
4. DEVICE USAGE: ANY handheld object that could be a phone, tablet, or electronic device. This includes:
   - Phones (smartphones, even partially visible)
   - Tablets or iPads
   - Smartwatches being looked at
   - Any rectangular handheld device
   - Objects being held near the face or in hands that could be devices

Be STRICT about device detection. If you see ANY object in the person's hands that could potentially be a device, flag it as device_usage.
If the person is holding anything rectangular or electronic-looking, flag it as a violation.

Return your analysis with high confidence when you detect these violations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: systemPrompt 
          },
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: "Analyze this proctoring frame for violations."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_proctoring_result",
              description: "Report the proctoring analysis result",
              parameters: {
                type: "object",
                properties: {
                  violation: { 
                    type: "boolean", 
                    description: "Whether a violation was detected" 
                  },
                  violationType: { 
                    type: "string", 
                    enum: ["multiple_people", "looking_away", "no_person", "device_usage", "none"],
                    description: "Type of violation detected" 
                  },
                  confidence: { 
                    type: "number", 
                    description: "Confidence score 0-100" 
                  },
                  details: { 
                    type: "string", 
                    description: "Brief explanation of what was detected" 
                  }
                },
                required: ["violation", "violationType", "confidence", "details"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "report_proctoring_result" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to analyze proctoring frame");
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls[0];
    const result = JSON.parse(toolCall.function.arguments);

    console.log("Proctoring analysis:", result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        violation: false,
        violationType: "none"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
