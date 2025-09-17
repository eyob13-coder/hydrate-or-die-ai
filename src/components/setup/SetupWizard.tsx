import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Settings, Key, Check, Mail, Cloud, Mic } from 'lucide-react'

interface SetupWizardProps {
  onComplete: () => void
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState({
    openai_key: '',
    vapi_key: '',
    resend_key: '',
    weather_key: ''
  })

  const handleApiKeySetup = (service: string, key: string) => {
    setConfig(prev => ({ ...prev, [`${service}_key`]: key }))
  }

  const services = [
    {
      id: 'openai',
      name: 'OpenAI API',
      description: 'Powers AI coaching messages and personalized insights',
      icon: '🤖',
      required: false,
      placeholder: 'sk-...',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'vapi',
      name: 'Vapi Voice AI', 
      description: 'Enables voice logging of water intake',
      icon: '🎤',
      required: false,
      placeholder: 'vapi_...',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'resend',
      name: 'Resend Email',
      description: 'Sends smart reminders and weekly summaries',
      icon: '📧',
      required: false,
      placeholder: 're_...',
      color: 'from-purple-500 to-violet-600'
    },
    {
      id: 'weather',
      name: 'Weather API',
      description: 'Weather-based hydration reminders',
      icon: '🌤️',
      required: false,
      placeholder: 'OpenWeatherMap API key',
      color: 'from-orange-500 to-amber-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Setup Your Hydrate-or-DIEdrate</CardTitle>
            <p className="text-muted-foreground">
              Configure optional integrations to unlock amazing features
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">API Key Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    All keys are optional. Skip any service you don't want to use.
                  </p>
                </div>

                {services.map((service) => (
                  <div key={service.id} className="space-y-3">
                    <div className={`p-4 rounded-lg bg-gradient-to-r ${service.color} text-white`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{service.icon}</span>
                          <span className="font-semibold">{service.name}</span>
                          {!service.required && (
                            <Badge variant="secondary" className="text-xs">Optional</Badge>
                          )}
                        </div>
                        {config[`${service.id}_key` as keyof typeof config] && (
                          <Check className="w-5 h-5" />
                        )}
                      </div>
                      <p className="text-sm opacity-90 mb-3">{service.description}</p>
                      <Input
                        type="password"
                        placeholder={service.placeholder}
                        value={config[`${service.id}_key` as keyof typeof config]}
                        onChange={(e) => handleApiKeySetup(service.id, e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                      />
                    </div>
                  </div>
                ))}

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Key className="w-4 h-4 mr-2" />
                    Security Note
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Your API keys are securely stored in Supabase and encrypted. 
                    You can update or remove them anytime in settings.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={onComplete}
              >
                Skip Setup
              </Button>
              <Button 
                onClick={onComplete}
                className="bg-gradient-to-r from-primary to-accent text-white"
              >
                Complete Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}