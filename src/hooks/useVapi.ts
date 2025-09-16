import { useState, useCallback } from 'react'
import Vapi from '@vapi-ai/web'
import { useToast } from './use-toast'
import { useHydration } from './useHydration'

export function useVapi() {
  const [vapi] = useState(() => new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY || ''))
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { logWater } = useHydration()

  const startRecording = useCallback(async () => {
    if (!import.meta.env.VITE_VAPI_PUBLIC_KEY) {
      toast({
        title: "Voice Feature Unavailable",
        description: "Vapi API key not configured. Please set up voice integration.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      await vapi.start({
        assistantId: import.meta.env.VITE_VAPI_ASSISTANT_ID,
        assistantOverrides: {
          variableValues: {
            systemPrompt: `You are a hydration assistant for the Hydrate-or-DIEdrate app. 
            Your job is to help users log their water intake through voice commands.
            
            Listen for phrases like:
            - "I drank 250ml" or "I had a glass of water"
            - "Log 500ml" or "Add half a liter"
            - "I finished a bottle" (assume 500ml)
            - "I had a cup" (assume 250ml)
            
            Extract the amount in milliliters and respond with just the number.
            If unclear, ask for clarification.
            Be encouraging and brief.`,
          },
        },
      })
      
      setIsSessionActive(true)
      
      vapi.on('speech-start', () => {
        console.log('User started speaking')
      })
      
      vapi.on('speech-end', () => {
        console.log('User stopped speaking')
      })
      
      vapi.on('call-end', () => {
        setIsSessionActive(false)
      })
      
      vapi.on('message', (message) => {
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          const transcript = message.transcript.toLowerCase()
          
          // Extract water amount from transcript
          const amount = extractWaterAmount(transcript)
          if (amount > 0) {
            logWater(amount, 'voice', undefined, transcript)
            toast({
              title: "Voice Log Successful! 🎤",
              description: `Added ${amount}ml via voice command`,
            })
            stopRecording()
          }
        }
      })
      
      vapi.on('error', (error) => {
        console.error('Vapi error:', error)
        toast({
          title: "Voice Error",
          description: "Failed to process voice command",
          variant: "destructive",
        })
        setIsSessionActive(false)
      })
      
    } catch (error) {
      console.error('Failed to start Vapi session:', error)
      toast({
        title: "Voice Error", 
        description: "Failed to start voice recording",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [vapi, toast, logWater])

  const stopRecording = useCallback(() => {
    vapi.stop()
    setIsSessionActive(false)
  }, [vapi])

  const extractWaterAmount = (transcript: string): number => {
    // Common patterns for water amount extraction
    const patterns = [
      /(\d+)\s*(ml|milliliters?)/i,
      /(\d+)\s*(l|liter|liters?)/i,
      /(\d+\.?\d*)\s*(cups?|glasses?)/i,
      /(bottle|water bottle)/i,
      /(cup|glass)/i,
    ]

    for (const pattern of patterns) {
      const match = transcript.match(pattern)
      if (match) {
        if (match[0].includes('liter') || match[0].includes(' l ')) {
          return parseFloat(match[1]) * 1000 // Convert liters to ml
        } else if (match[0].includes('cup') || match[0].includes('glass')) {
          return parseFloat(match[1] || '1') * 250 // Assume 250ml per cup/glass
        } else if (match[0].includes('bottle')) {
          return 500 // Assume 500ml bottle
        } else if (match[1]) {
          return parseFloat(match[1])
        }
      }
    }

    // Fallback: look for standalone numbers and assume ml
    const numberMatch = transcript.match(/(\d+)/i)
    if (numberMatch) {
      const num = parseFloat(numberMatch[1])
      if (num >= 50 && num <= 5000) { // Reasonable range for ml
        return num
      }
    }

    return 0
  }

  return {
    startRecording,
    stopRecording,
    isSessionActive,
    isLoading,
  }
}