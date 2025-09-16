import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAICoach } from '@/hooks/useAICoach'
import { Bot, Sparkles, Zap, MessageCircle } from 'lucide-react'
import { useState } from 'react'

export function AICoach() {
  const { messages, isGenerating, requestMotivation, requestSarcasm } = useAICoach()
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement': return '🏆'
      case 'reminder': return '⏰'
      case 'motivational': return '💪'
      case 'sarcastic': return '😏'
      case 'encouragement': return '🎉'
      default: return '💧'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'bg-hydration-success/20 text-hydration-success border-hydration-success/30'
      case 'reminder': return 'bg-hydration-warning/20 text-hydration-warning border-hydration-warning/30'
      case 'motivational': return 'bg-primary/20 text-primary border-primary/30'
      case 'sarcastic': return 'bg-hydration-accent/20 text-hydration-accent border-hydration-accent/30'
      default: return 'bg-secondary/20 text-secondary-foreground border-secondary/30'
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span>AI Hydration Coach</span>
          {isGenerating && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={requestMotivation}
            disabled={isGenerating}
            className="flex items-center space-x-1 hover:bg-primary/10 hover:border-primary/30"
          >
            <Zap className="w-3 h-3" />
            <span>Motivate Me</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={requestSarcasm}
            disabled={isGenerating}
            className="flex items-center space-x-1 hover:bg-accent/10 hover:border-accent/30"
          >
            <MessageCircle className="w-3 h-3" />
            <span>Keep It Real</span>
          </Button>
        </div>

        {/* Messages List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Bot className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                <p>Your AI coach is ready to help!</p>
                <p className="text-sm">Log some water to get personalized coaching.</p>
              </motion.div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                      <span className="text-sm">{getTypeIcon(message.type)}</span>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getTypeColor(message.type)}`}
                        >
                          {message.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm leading-relaxed">
                          {expandedMessage === message.id || message.message.length <= 100
                            ? message.message
                            : `${message.message.slice(0, 100)}...`
                          }
                        </p>
                        
                        {message.message.length > 100 && (
                          <button
                            onClick={() => setExpandedMessage(
                              expandedMessage === message.id ? null : message.id
                            )}
                            className="text-xs text-primary hover:text-primary/80 mt-1"
                          >
                            {expandedMessage === message.id ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Coaching Tips */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center space-x-1">
            <Sparkles className="w-3 h-3" />
            <span>Pro Tips</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <p>💡 Morning hydration kickstarts metabolism</p>
            <p>🎯 Small, frequent sips beat chugging</p>
            <p>🌡️ Room temperature water absorbs faster</p>
            <p>⚡ Add lemon for extra motivation!</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}