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

    // Get all users for weekly summary
    const { data: users, error } = await supabaseClient
      .from('profiles')
      .select(`
        *,
        user_id,
        users:auth.users(email)
      `)

    if (error) throw error

    const results = []

    for (const user of users) {
      // Get last 7 days of logs
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { data: weekLogs } = await supabaseClient
        .from('hydration_logs')
        .select('*')
        .eq('user_id', user.user_id)
        .gte('logged_at', weekAgo.toISOString())
        .order('logged_at', { ascending: true })

      // Get achievements from this week
      const { data: achievements } = await supabaseClient
        .from('achievements')
        .select('*')
        .eq('user_id', user.user_id)
        .gte('earned_at', weekAgo.toISOString())

      const analytics = analyzeWeeklyData(weekLogs || [], user)
      const emailContent = generateWeeklySummary(user, analytics, achievements || [])
      
      // Send weekly summary email
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Hydrate-or-DIEdrate <weekly@your-domain.com>',
          to: [user.users.email],
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      })

      results.push({
        user_id: user.user_id,
        email_sent: emailResponse.ok,
        week_total: analytics.totalWeek,
        days_goal_met: analytics.daysGoalMet
      })
    }

    return new Response(
      JSON.stringify({ 
        message: 'Weekly summaries sent',
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

function analyzeWeeklyData(logs: any[], user: any) {
  const dailyTotals = new Map()
  
  // Group logs by date
  logs.forEach(log => {
    const date = log.logged_at.split('T')[0]
    const current = dailyTotals.get(date) || 0
    dailyTotals.set(date, current + log.amount)
  })

  const totalWeek = Array.from(dailyTotals.values()).reduce((sum, daily) => sum + daily, 0)
  const averageDaily = totalWeek / 7
  const daysGoalMet = Array.from(dailyTotals.values()).filter(daily => daily >= user.daily_goal).length
  const bestDay = Math.max(...Array.from(dailyTotals.values()), 0)
  const consistency = daysGoalMet / 7 * 100

  // Mood analysis if available
  const moodLogs = logs.filter(log => log.mood)
  const moodCounts = moodLogs.reduce((acc, log) => {
    acc[log.mood] = (acc[log.mood] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalWeek,
    averageDaily,
    daysGoalMet,
    bestDay,
    consistency,
    moodCounts,
    weeklyGoal: user.daily_goal * 7
  }
}

function generateWeeklySummary(user: any, analytics: any, achievements: any[]) {
  const goalPercentage = Math.round((analytics.totalWeek / analytics.weeklyGoal) * 100)
  
  return {
    subject: `📊 Your weekly hydration report - ${goalPercentage}% of goal achieved!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: linear-gradient(135deg, #EBF8FF, #F0F9FF); padding: 30px; border-radius: 20px;">
        <h1 style="text-align: center; color: #1E40AF; margin-bottom: 30px;">
          📊 Weekly Hydration Report
        </h1>
        
        <div style="background: white; padding: 25px; border-radius: 15px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1F2937; margin-bottom: 20px;">Hey ${user.full_name || 'Hydration Hero'}! 👋</h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 25px 0;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; border-radius: 12px;">
              <h3 style="margin: 0; font-size: 2em;">${analytics.totalWeek.toLocaleString()}ml</h3>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Total This Week</p>
            </div>
            
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10B981, #047857); color: white; border-radius: 12px;">
              <h3 style="margin: 0; font-size: 2em;">${Math.round(analytics.averageDaily)}ml</h3>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Daily Average</p>
            </div>
            
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; border-radius: 12px;">
              <h3 style="margin: 0; font-size: 2em;">${analytics.daysGoalMet}/7</h3>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Goals Achieved</p>
            </div>
          </div>

          <div style="background: #F9FAFB; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #374151; margin-bottom: 15px;">📈 Weekly Progress</h3>
            <div style="background: #E5E7EB; border-radius: 10px; overflow: hidden; height: 30px; position: relative;">
              <div style="background: linear-gradient(90deg, #3B82F6, #10B981); height: 100%; width: ${Math.min(goalPercentage, 100)}%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                ${goalPercentage}%
              </div>
            </div>
            <p style="margin: 10px 0 0 0; color: #6B7280; text-align: center;">
              ${analytics.totalWeek >= analytics.weeklyGoal ? 
                "🎉 Congratulations! You exceeded your weekly goal!" : 
                `You needed ${(analytics.weeklyGoal - analytics.totalWeek).toLocaleString()}ml more to reach your weekly goal.`}
            </p>
          </div>

          ${achievements.length > 0 ? `
            <div style="background: linear-gradient(135deg, #FEF3C7, #FDE68A); padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #92400E; margin-bottom: 15px;">🏆 New Achievements This Week</h3>
              ${achievements.map(achievement => `
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #F59E0B;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5em;">${achievement.icon}</span>
                    <div>
                      <strong style="color: #92400E;">${achievement.title}</strong>
                      <p style="margin: 5px 0 0 0; color: #78350F; font-size: 0.9em;">${achievement.description}</p>
                      <small style="color: #A16207;">+${achievement.points} points</small>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div style="background: #EBF8FF; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin-bottom: 15px;">💡 Insights & Tips</h3>
            <ul style="color: #1F2937; line-height: 1.6;">
              <li><strong>Consistency Score:</strong> ${Math.round(analytics.consistency)}% - ${analytics.consistency > 80 ? 'Excellent!' : analytics.consistency > 60 ? 'Good job!' : 'Room for improvement'}</li>
              <li><strong>Best Day:</strong> You consumed ${analytics.bestDay}ml on your best day! 🌟</li>
              ${Object.keys(analytics.moodCounts).length > 0 ? `<li><strong>Mood Trends:</strong> You felt ${Object.entries(analytics.moodCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0][0]} most often when logging water</li>` : ''}
              <li><strong>Current Streak:</strong> ${user.streak} days 🔥</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6B7280;">Keep up the amazing work! 💪</p>
            <a href="https://your-app-url.com" style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; margin-top: 15px;">
              Open Hydrate-or-DIEdrate 💧
            </a>
          </div>
        </div>
      </div>
    `
  }
}