import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useVapi } from '@/hooks/useVapi'
import { Mic, MicOff, Volume2 } from 'lucide-react'

export function VoiceLogger() {
  const { startRecording, stopRecording, isSessionActive, isLoading } = useVapi()

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Volume2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Voice Logging</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            {isSessionActive 
              ? "🎤 Listening... Say something like 'I drank 500ml' or 'I had a glass of water'"
              : "Tap the microphone and tell me how much water you drank!"
            }
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={isSessionActive ? stopRecording : startRecording}
              disabled={isLoading}
              className={`w-20 h-20 rounded-full text-white font-semibold transition-all duration-300 ${
                isSessionActive
                  ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90'
              }`}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Mic className="w-8 h-8" />
                </motion.div>
              ) : isSessionActive ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <MicOff className="w-8 h-8" />
                </motion.div>
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
          </motion.div>

          {isSessionActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center space-x-2 text-sm text-primary"
            >
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
              <span>Recording...</span>
            </motion.div>
          )}

          <div className="text-xs text-muted-foreground mt-4">
            <p>💡 Try saying:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2 text-left">
              <p>• "I drank 250ml"</p>
              <p>• "I had a glass of water"</p>
              <p>• "Log 500ml"</p>
              <p>• "I finished a bottle"</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}