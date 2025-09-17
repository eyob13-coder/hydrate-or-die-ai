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

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      throw new Error('Resend API key not configured')
    }

    // Get all users who need reminders
    const { data: users, error } = await supabaseClient
      .from('profiles')
      .select(`
        *,
        user_id,
        users:auth.users(email)
      `)
      .gte('streak', 1) // Only active users

    if (error) throw error

    const weatherKey = Deno.env.get('WEATHER_API_KEY')
    let weatherData = null
    
    if (weatherKey) {
      // Get weather data (you can make this location-specific per user)
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=San Francisco&appid=${weatherKey}&units=metric`
      )
      weatherData = await weatherResponse.json()
    }

    const results = []

    for (const user of users) {
      // Check if user needs a reminder based on their last log
      const { data: todayLogs } = await supabaseClient
        .from('hydration_logs')
        .select('*')
        .eq('user_id', user.user_id)
        .gte('logged_at', new Date().toISOString().split('T')[0])

      const todayTotal = todayLogs?.reduce((sum, log) => sum + log.amount, 0) || 0
      const progressPercentage = (todayTotal / user.daily_goal) * 100
      
      // Skip if they've already reached their goal
      if (progressPercentage >= 100) continue

      // Determine reminder type based on time and progress
      const currentHour = new Date().getHours()
      let reminderType = 'gentle'
      
      if (currentHour > 18 && progressPercentage < 50) {
        reminderType = 'urgent'
      } else if (weatherData?.main?.temp > 25) {
        reminderType = 'weather_hot'
      } else if (progressPercentage < 25 && currentHour > 12) {
        reminderType = 'behind_schedule'
      }

      const emailContent = generateEmailContent(user, todayTotal, reminderType, weatherData)
      
      // Send email via Resend
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Hydrate-or-DIEdrate <hydration@your-domain.com>',
          to: [user.users.email],
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      })

      results.push({
        user_id: user.user_id,
        email_sent: emailResponse.ok,
        reminder_type: reminderType,
        progress: progressPercentage
      })
    }

    return new Response(
      JSON.stringify({ 
        message: 'Reminders processed',
        results,
        total_sent: results.filter(r => r.email_sent).length
      }),
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

function generateEmailContent(user: any, todayTotal: number, reminderType: string, weatherData: any) {
  const remaining = user.daily_goal - todayTotal
  const progressPercentage = Math.round((todayTotal / user.daily_goal) * 100)

  const content = {
    gentle: {
      subject: "💧 Friendly hydration reminder!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Hey ${user.full_name || 'there'}! 👋</h2>
          <p>Just a gentle reminder to stay hydrated today!</p>
          <div style="background: linear-gradient(135deg, #EBF8FF, #DBEAFE); padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3>Your Progress Today:</h3>
            <div style="background: #E5E7EB; border-radius: 10px; overflow: hidden; margin: 10px 0;">
              <div style="background: #3B82F6; height: 20px; width: ${progressPercentage}%; transition: width 0.3s;"></div>
            </div>
            <p><strong>${todayTotal}ml</strong> of ${user.daily_goal}ml (${progressPercentage}%)</p>
            <p style="color: #7C3AED;"><strong>${remaining}ml to go!</strong></p>
          </div>
          <p>Keep up the great work! 🌟</p>
        </div>`
    },
    urgent: {
      subject: "🚨 Your hydration needs attention!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #EF4444;">Hydration Alert! 🚨</h2>
          <p>Hey ${user.full_name || 'there'}, the day is almost over and you're at ${progressPercentage}% of your goal.</p>
          <p><strong>You still need ${remaining}ml to reach your ${user.daily_goal}ml goal!</strong></p>
          <p style="background: #FEF2F2; padding: 15px; border-radius: 8px; border-left: 4px solid #EF4444;">
            Don't break your ${user.streak}-day streak! 🔥 Grab a glass of water right now!
          </p>
        </div>`
    },
    weather_hot: {
      subject: `☀️ It's ${weatherData?.main?.temp}°C - Time to hydrate!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F59E0B;">Hot Weather Alert! ☀️</h2>
          <p>It's ${weatherData?.main?.temp}°C outside - perfect weather for extra hydration!</p>
          <p>You're at ${progressPercentage}% of your goal. In hot weather, you might need even more water.</p>
          <p style="background: #FFFBEB; padding: 15px; border-radius: 8px;">
            💡 <strong>Hot weather tip:</strong> Add some electrolytes or have a sports drink to replace what you lose through sweat!
          </p>
        </div>`
    }
  }

  return content[reminderType as keyof typeof content] || content.gentle
}