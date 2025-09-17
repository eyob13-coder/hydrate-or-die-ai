import { useState, useEffect } from 'react'
import { useToast } from './use-toast'
import { useHydration } from './useHydration'

interface CoachingMessage {
  id: string
  message: string
  type: 'encouragement' | 'reminder' | 'achievement' | 'sarcastic' | 'motivational'
  timestamp: Date
}

export function useAICoach() {
  const [messages, setMessages] = useState<CoachingMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()
  const { todayTotal, profile, getProgressPercentage } = useHydration()

  const generateCoachingMessage = async (
    context: 'goal_reached' | 'behind_schedule' | 'streak_milestone' | 'motivational' | 'random'
  ) => {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      // Fallback to pre-written messages if no AI key
      return getFallbackMessage(context)
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          context,
          userStats: {
            todayTotal,
            dailyGoal: profile?.daily_goal || 2000,
            streak: profile?.streak || 0,
            progressPercentage: getProgressPercentage(),
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to generate message')
      
      const data = await response.json()
      return data.message
    } catch (error) {
      console.error('AI coaching error:', error)
      return getFallbackMessage(context)
    } finally {
      setIsGenerating(false)
    }
  }

  const getFallbackMessage = (context: string): string => {
    const messages = {
      goal_reached: [
        "🎉 Boom! You've crushed your hydration goal! Your cells are throwing a party right now!",
        "💧 Goal achieved! You're officially a hydration legend today!",
        "🏆 Daily goal: SMASHED! Your kidneys are sending you a thank you card!",
        "✨ Hydration master level unlocked! Keep this energy tomorrow!",
      ],
      behind_schedule: [
        "🤔 Hmm, your water bottle is looking lonely... maybe give it some attention?",
        "⏰ Time check: Your hydration is running behind schedule. Let's catch up!",
        "💦 Your body is sending subtle hints (like thirst). Maybe listen to it?",
        "🚨 Hydration alert! You're falling behind, but it's never too late to catch up!",
      ],
      streak_milestone: [
        "🔥 Streak on fire! You're building some serious hydration habits!",
        "⚡ Consistency level: LEGENDARY! Your streak is impressive!",
        "🎯 Another day, another hydration victory! Keep the streak alive!",
        "💪 Your dedication to hydration is inspiring! Streak power activated!",
      ],
      motivational: [
        "💧 Every sip is a step towards better health. You've got this!",
        "🌊 Think of it as giving your body the premium fuel it deserves!",
        "✨ Hydration isn't just drinking water, it's self-care in liquid form!",
        "🚀 Your future self will thank you for every drop you drink today!",
      ],
      random: [
        "💡 Fun fact: Your brain is 75% water. Feed it well!",
        "🌱 You're literally watering your internal garden. How zen is that?",
        "🎭 Plot twist: The secret to glowing skin might just be... water!",
        "🤖 Beep boop! AI coach reminder: H2O = Happy, Healthy, Outstanding you!",
      ],
    }

    const contextMessages = messages[context as keyof typeof messages] || messages.motivational
    return contextMessages[Math.floor(Math.random() * contextMessages.length)]
  }

  const addMessage = async (type: CoachingMessage['type'], context: 'goal_reached' | 'behind_schedule' | 'streak_milestone' | 'motivational' | 'random') => {
    const message = await generateCoachingMessage(context)
    
    const newMessage: CoachingMessage = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
    }

    setMessages(prev => [newMessage, ...prev].slice(0, 10)) // Keep last 10 messages
    
    toast({
      title: "🤖 AI Coach",
      description: message,
      duration: 5000,
    })
  }

  // Auto-generate contextual messages
  useEffect(() => {
    if (!profile) return

    const progressPercentage = getProgressPercentage()
    const currentHour = new Date().getHours()

    // Goal reached celebration
    if (progressPercentage >= 100 && messages.length === 0) {
      addMessage('achievement', 'goal_reached')
    }
    
    // Behind schedule reminders
    else if (currentHour > 14 && progressPercentage < 50) {
      addMessage('reminder', 'behind_schedule')
    }
    
    // Streak milestones
    else if (profile.streak > 0 && profile.streak % 7 === 0) {
      addMessage('motivational', 'streak_milestone')
    }
  }, [todayTotal, profile])

  const requestMotivation = () => {
    addMessage('motivational', 'motivational')
  }

  const requestSarcasm = () => {
    addMessage('sarcastic', 'behind_schedule')
  }

  return {
    messages,
    isGenerating,
    requestMotivation,
    requestSarcasm,
    addMessage,
  }
}