import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { context, userStats } = await req.json()
    
    // Get OpenAI API key from secrets
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const systemPrompt = generateSystemPrompt(context, userStats)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Generate a ${context} message for a user with these stats: ${JSON.stringify(userStats)}`
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    })

    const data = await response.json()
    const message = data.choices[0].message.content

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    )
  }
})

function generateSystemPrompt(context: string, userStats: any): string {
  const basePrompt = `You are an AI hydration coach for the "Hydrate-or-DIEdrate" app. Be encouraging, fun, and slightly sarcastic when appropriate. Keep responses under 100 characters for mobile notifications.

User Stats:
- Today's intake: ${userStats.todayTotal}ml
- Daily goal: ${userStats.dailyGoal}ml  
- Current streak: ${userStats.streak} days
- Progress: ${userStats.progressPercentage}%

Personality: Mix of motivational coach and witty friend. Use water/hydration puns when possible.`

  const contextPrompts = {
    goal_reached: basePrompt + "\n\nContext: User just reached their daily goal! Celebrate their achievement with enthusiasm and encourage them to maintain the habit.",
    behind_schedule: basePrompt + "\n\nContext: User is behind on their hydration. Give them a gentle but motivating nudge. Be slightly cheeky but supportive.",
    streak_milestone: basePrompt + "\n\nContext: User hit a streak milestone. Celebrate their consistency and motivate them to keep going.",
    motivational: basePrompt + "\n\nContext: User requested motivation. Give them an inspiring message about the benefits of staying hydrated.",
    random: basePrompt + "\n\nContext: Share an interesting fact about hydration or a creative reminder to drink water."
  }

  return contextPrompts[context as keyof typeof contextPrompts] || basePrompt
}