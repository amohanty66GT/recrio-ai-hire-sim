import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, companyDescription } = await req.json();
    
    if (!jobDescription || !companyDescription) {
      return new Response(
        JSON.stringify({ error: 'Job description and company description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating simulation for:', { jobDescription, companyDescription });

    const systemPrompt = `You are an AI that generates realistic workplace simulation scenarios for hiring assessments. 
Your task is to create a dynamic, engaging simulation based on the provided job description and company description.

The simulation should:
1. Create 3 channels (e.g., Engineering Team, Product Development, Data & Analytics)
2. Each channel should have exactly 6 questions total (including follow-ups). For example: 3 main questions with 2 follow-ups each = 6 total
3. Include realistic team member dialogue that sets context BEFORE each main question
4. Create distinct AI personas (e.g., Founder, Lead Engineer, Product Manager, Designer)
5. Make the scenario feel authentic to a startup environment
6. Include stimulus materials (code snippets, documents, data) for 30-40% of questions where relevant
7. Stimulus materials should be realistic and role-appropriate (e.g., code for engineers, designs for designers, data for analysts)
8. Each main question should have 2-3 context messages from different team members BEFORE the question is asked, creating realistic workplace atmosphere

Return a JSON structure with this exact format:
{
  "agents": [
    {
      "name": "Agent Name",
      "role": "Their Role",
      "personality": "Brief personality description"
    }
  ],
  "channels": [
    {
      "id": "channel-id",
      "name": "channel-name",
      "description": "What this channel is about"
    }
  ],
  "questions": [
    {
      "id": "q1",
      "channel": "channel-id",
      "mainQuestion": "The primary question",
      "stimulus": {
        "type": "code|document|data",
        "title": "Brief title for the stimulus",
        "content": "The actual code snippet, document text, or data"
      },
      "context": [
        {
          "agent": "Agent Name",
          "message": "Context setting message from team member 1"
        },
        {
          "agent": "Another Agent Name",
          "message": "Additional context or realistic workplace banter"
        }
      ],
      "followUps": [
        {
          "id": "q1-f1",
          "agent": "Agent Name",
          "question": "Follow up question 1"
        },
        {
          "id": "q1-f2",
          "agent": "Agent Name",
          "question": "Follow up question 2"
        }
      ]
    }
  ]
}

Note: The "stimulus" field is optional. Include it only when the question would benefit from having a code snippet, document, or data to analyze.
The "context" array should have 2-3 messages from different team members that create realistic workplace atmosphere BEFORE each main question is asked.`;

    const userPrompt = `Create a hiring simulation scenario for the following:

Job Description:
${jobDescription}

Company Description:
${companyDescription}

Generate a realistic simulation with 3 channels, each containing exactly 6 questions total (including follow-ups). For example: 3 main questions with 2 follow-ups each = 6 total questions per channel.

Include stimulus materials (code snippets, documents, data to analyze) for 30-40% of questions where it would be realistic and valuable for assessment. Make these materials authentic and relevant to the role.

IMPORTANT: For each main question, include 2-3 context messages from different team members BEFORE the question is asked. These should feel like natural workplace dialogue that sets up the situation, provides background, or adds realistic atmosphere - just like how colleagues chat before diving into a specific question or problem.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate simulation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    // Extract JSON from the response (handle markdown code blocks)
    let scenarioJson;
    try {
      const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                       generatedText.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : generatedText;
      scenarioJson = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse JSON:', e, generatedText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse generated scenario' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully generated simulation');
    
    return new Response(
      JSON.stringify({ scenario: scenarioJson }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-simulation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
