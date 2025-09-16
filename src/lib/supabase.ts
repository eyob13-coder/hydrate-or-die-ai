import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          daily_goal: number
          weight: number | null
          activity_level: string
          timezone: string | null
          streak: number
          total_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          daily_goal?: number
          weight?: number | null
          activity_level?: string
          timezone?: string | null
          streak?: number
          total_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          daily_goal?: number
          weight?: number | null
          activity_level?: string
          timezone?: string | null
          streak?: number
          total_points?: number
          created_at?: string
          updated_at?: string
        }
      }
      hydration_logs: {
        Row: {
          id: string
          user_id: string
          amount: number
          logged_at: string
          method: string
          mood: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          logged_at?: string
          method?: string
          mood?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          logged_at?: string
          method?: string
          mood?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          icon: string
          points: number
          earned_at: string
          category: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          icon: string
          points: number
          earned_at?: string
          category: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          icon?: string
          points?: number
          earned_at?: string
          category?: string
        }
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string
          goal_amount: number
          duration_days: number
          points_reward: number
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          goal_amount: number
          duration_days: number
          points_reward: number
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          goal_amount?: number
          duration_days?: number
          points_reward?: number
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
        }
      }
    }
  }
}