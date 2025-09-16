import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'

export interface HydrationLog {
  id: string
  user_id: string
  amount: number
  logged_at: string
  method: string
  mood?: string
  notes?: string
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name?: string
  daily_goal: number
  weight?: number
  activity_level: string
  streak: number
  total_points: number
}

export function useHydration() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [logs, setLogs] = useState<HydrationLog[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [todayTotal, setTodayTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchTodayLogs()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error)
    } else if (data) {
      setProfile(data)
    } else {
      // Create default profile
      await createProfile()
    }
  }

  const createProfile = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || '',
          daily_goal: 2000, // Default 2L
          activity_level: 'moderate',
          streak: 0,
          total_points: 0,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
    } else {
      setProfile(data)
    }
  }

  const fetchTodayLogs = async () => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('hydration_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', today)
      .lt('logged_at', new Date(Date.now() + 86400000).toISOString().split('T')[0])
      .order('logged_at', { ascending: false })

    if (error) {
      console.error('Error fetching logs:', error)
    } else {
      setLogs(data || [])
      const total = data?.reduce((sum, log) => sum + log.amount, 0) || 0
      setTodayTotal(total)
    }
    setLoading(false)
  }

  const logWater = async (amount: number, method: string = 'manual', mood?: string, notes?: string) => {
    if (!user) return

    const { data, error } = await supabase
      .from('hydration_logs')
      .insert([
        {
          user_id: user.id,
          amount,
          method,
          mood,
          notes,
          logged_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error logging water:', error)
      toast({
        title: "Error",
        description: "Failed to log water intake",
        variant: "destructive",
      })
    } else {
      setLogs(prev => [data, ...prev])
      setTodayTotal(prev => prev + amount)
      
      // Check for achievements
      checkAchievements(todayTotal + amount)
      
      toast({
        title: "Water Logged! 💧",
        description: `Added ${amount}ml to your daily total`,
      })
    }
  }

  const checkAchievements = async (newTotal: number) => {
    if (!profile) return

    const goalReached = newTotal >= profile.daily_goal
    const milestones = [250, 500, 1000, 1500, 2000, 3000, 4000]
    
    for (const milestone of milestones) {
      if (newTotal >= milestone && todayTotal < milestone) {
        // Award achievement
        await supabase.from('achievements').insert([
          {
            user_id: user!.id,
            title: `${milestone}ml Milestone`,
            description: `Reached ${milestone}ml in a day!`,
            icon: '🎯',
            points: milestone / 100,
            category: 'milestone',
          },
        ])
      }
    }

    if (goalReached && todayTotal < profile.daily_goal) {
      // Update streak
      await updateStreak()
      
      toast({
        title: "Goal Achieved! 🎉",
        description: "You've reached your daily hydration goal!",
      })
    }
  }

  const updateStreak = async () => {
    if (!user || !profile) return

    const { error } = await supabase
      .from('profiles')
      .update({ 
        streak: profile.streak + 1,
        total_points: profile.total_points + 100,
      })
      .eq('user_id', user.id)

    if (!error) {
      setProfile(prev => prev ? {
        ...prev,
        streak: prev.streak + 1,
        total_points: prev.total_points + 100,
      } : null)
    }
  }

  const getProgressPercentage = () => {
    if (!profile) return 0
    return Math.min((todayTotal / profile.daily_goal) * 100, 100)
  }

  const getRemainingAmount = () => {
    if (!profile) return 0
    return Math.max(profile.daily_goal - todayTotal, 0)
  }

  return {
    logs,
    profile,
    todayTotal,
    loading,
    logWater,
    getProgressPercentage,
    getRemainingAmount,
    fetchTodayLogs,
  }
}