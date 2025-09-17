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

    const { user_id, period = '7d' } = await req.json()

    if (!user_id) {
      throw new Error('User ID is required')
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (profileError) throw profileError

    // Get hydration logs
    const { data: logs, error: logsError } = await supabaseClient
      .from('hydration_logs')
      .select('*')
      .eq('user_id', user_id)
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString())
      .order('logged_at', { ascending: true })

    if (logsError) throw logsError

    // Get achievements
    const { data: achievements, error: achievementsError } = await supabaseClient
      .from('achievements')
      .select('*')
      .eq('user_id', user_id)
      .gte('earned_at', startDate.toISOString())
      .order('earned_at', { ascending: false })

    if (achievementsError) throw achievementsError

    // Analyze data
    const analytics = {
      overview: generateOverviewAnalytics(logs, profile, period),
      patterns: analyzePatterns(logs),
      predictions: generatePredictions(logs, profile),
      recommendations: generateRecommendations(logs, profile),
      mood_correlation: analyzeMoodCorrelation(logs),
      achievements: achievements || []
    }

    return new Response(
      JSON.stringify(analytics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateOverviewAnalytics(logs: any[], profile: any, period: string) {
  const total = logs.reduce((sum, log) => sum + log.amount, 0)
  const days = period === '24h' ? 1 : period === '7d' ? 7 : 30
  const dailyAverage = total / days
  const goalReachDays = countGoalReachDays(logs, profile.daily_goal)
  
  return {
    total_intake: total,
    daily_average: Math.round(dailyAverage),
    goal_achievement_rate: Math.round((goalReachDays / days) * 100),
    current_streak: profile.streak,
    total_points: profile.total_points,
    period_comparison: {
      vs_goal: Math.round((dailyAverage / profile.daily_goal) * 100),
      trend: calculateTrend(logs)
    }
  }
}

function analyzePatterns(logs: any[]) {
  const hourlyPattern = new Map()
  const methodPattern = new Map()
  const weekdayPattern = new Map()

  logs.forEach(log => {
    // Hourly patterns
    const hour = new Date(log.logged_at).getHours()
    hourlyPattern.set(hour, (hourlyPattern.get(hour) || 0) + log.amount)

    // Method patterns
    methodPattern.set(log.method, (methodPattern.get(log.method) || 0) + log.amount)

    // Weekday patterns
    const weekday = new Date(log.logged_at).toLocaleDateString('en', { weekday: 'long' })
    weekdayPattern.set(weekday, (weekdayPattern.get(weekday) || 0) + log.amount)
  })

  return {
    peak_hours: Array.from(hourlyPattern.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, amount]) => ({ hour, amount })),
    preferred_methods: Array.from(methodPattern.entries())
      .sort(([,a], [,b]) => b - a)
      .map(([method, amount]) => ({ method, amount, percentage: Math.round((amount / logs.reduce((sum, log) => sum + log.amount, 0)) * 100) })),
    best_days: Array.from(weekdayPattern.entries())
      .sort(([,a], [,b]) => b - a)
      .map(([day, amount]) => ({ day, amount }))
  }
}

function generatePredictions(logs: any[], profile: any) {
  const recentLogs = logs.slice(-7) // Last 7 entries
  const recentAverage = recentLogs.reduce((sum, log) => sum + log.amount, 0) / Math.max(recentLogs.length, 1)
  
  const projectedDaily = Math.round(recentAverage * 1.1) // 10% optimistic projection
  const weeklyProjection = projectedDaily * 7
  const monthlyProjection = projectedDaily * 30

  return {
    daily_projection: projectedDaily,
    weekly_projection: weeklyProjection,
    monthly_projection: monthlyProjection,
    goal_likelihood: Math.min(Math.round((projectedDaily / profile.daily_goal) * 100), 100),
    streak_prediction: profile.streak + (projectedDaily >= profile.daily_goal ? 7 : 0)
  }
}

function generateRecommendations(logs: any[], profile: any) {
  const recommendations = []
  const dailyAverage = logs.reduce((sum, log) => sum + log.amount, 0) / Math.max(logs.length, 1)
  
  // Goal-based recommendations
  if (dailyAverage < profile.daily_goal * 0.8) {
    recommendations.push({
      type: 'goal',
      priority: 'high',
      title: 'Increase Daily Intake',
      message: `You're averaging ${Math.round(dailyAverage)}ml daily. Try adding ${Math.round(profile.daily_goal - dailyAverage)}ml more to reach your goal consistently.`,
      action: 'Set more frequent reminders'
    })
  }

  // Pattern-based recommendations
  const hourlyActivity = analyzeHourlyActivity(logs)
  if (hourlyActivity.gaps.length > 0) {
    recommendations.push({
      type: 'timing',
      priority: 'medium',
      title: 'Fill the Gaps',
      message: `You tend to drink less water between ${hourlyActivity.gaps[0]}:00. Try setting a reminder for this time.`,
      action: 'Schedule reminder'
    })
  }

  // Method diversification
  const methods = [...new Set(logs.map(log => log.method))]
  if (methods.length === 1 && methods[0] === 'manual') {
    recommendations.push({
      type: 'method',
      priority: 'low',
      title: 'Try Voice Logging',
      message: 'Voice logging can make tracking more convenient and fun! Give it a try.',
      action: 'Enable voice features'
    })
  }

  return recommendations
}

function analyzeMoodCorrelation(logs: any[]) {
  const moodLogs = logs.filter(log => log.mood)
  if (moodLogs.length === 0) return null

  const moodIntake = new Map()
  moodLogs.forEach(log => {
    const currentTotal = moodIntake.get(log.mood) || { total: 0, count: 0 }
    moodIntake.set(log.mood, {
      total: currentTotal.total + log.amount,
      count: currentTotal.count + 1
    })
  })

  const correlations = Array.from(moodIntake.entries()).map(([mood, data]) => ({
    mood,
    average_intake: Math.round(data.total / data.count),
    frequency: data.count
  })).sort((a, b) => b.average_intake - a.average_intake)

  return {
    strongest_correlation: correlations[0],
    all_correlations: correlations,
    insight: correlations.length > 1 ? 
      `You drink ${correlations[0].average_intake - correlations[correlations.length - 1].average_intake}ml more on average when feeling ${correlations[0].mood} vs ${correlations[correlations.length - 1].mood}` :
      `Most of your logged moods are ${correlations[0].mood}`
  }
}

function countGoalReachDays(logs: any[], dailyGoal: number) {
  const dailyTotals = new Map()
  logs.forEach(log => {
    const date = log.logged_at.split('T')[0]
    dailyTotals.set(date, (dailyTotals.get(date) || 0) + log.amount)
  })
  
  return Array.from(dailyTotals.values()).filter(total => total >= dailyGoal).length
}

function calculateTrend(logs: any[]) {
  if (logs.length < 2) return 'insufficient_data'
  
  const midpoint = Math.floor(logs.length / 2)
  const firstHalf = logs.slice(0, midpoint).reduce((sum, log) => sum + log.amount, 0) / midpoint
  const secondHalf = logs.slice(midpoint).reduce((sum, log) => sum + log.amount, 0) / (logs.length - midpoint)
  
  const percentChange = ((secondHalf - firstHalf) / firstHalf) * 100
  
  if (percentChange > 10) return 'improving'
  if (percentChange < -10) return 'declining'
  return 'stable'
}

function analyzeHourlyActivity(logs: any[]) {
  const hourlyTotals = new Map()
  logs.forEach(log => {
    const hour = new Date(log.logged_at).getHours()
    hourlyTotals.set(hour, (hourlyTotals.get(hour) || 0) + log.amount)
  })

  const activeHours = Array.from(hourlyTotals.keys()).sort((a, b) => a - b)
  const gaps = []
  
  for (let i = 0; i < activeHours.length - 1; i++) {
    const gap = activeHours[i + 1] - activeHours[i]
    if (gap > 3) { // 3+ hour gap
      gaps.push(activeHours[i] + 1)
    }
  }

  return { gaps, activeHours }
}