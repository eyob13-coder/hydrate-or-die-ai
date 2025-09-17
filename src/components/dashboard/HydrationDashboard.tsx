import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { WaterWave } from "@/components/ui/water-wave"
import { VoiceLogger } from "./VoiceLogger"
import { AICoach } from "./AICoach"
import { HydrationChart } from "./HydrationChart"
import { useHydration } from '@/hooks/useHydration'
import { useAuth } from '@/hooks/useAuth'
import { Droplets, Target, Zap, Trophy, Camera, Plus, Settings, Bell } from 'lucide-react'
import { useState } from 'react'

export function HydrationDashboard() {
  const { user, signOut } = useAuth()
  const { 
    profile, 
    todayTotal, 
    loading, 
    logWater, 
    getProgressPercentage, 
    getRemainingAmount 
  } = useHydration()
  
  const [isLogging, setIsLogging] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'voice' | 'coach' | 'chart'>('overview')

  const quickLogAmounts = [250, 500, 750, 1000]

  const handleQuickLog = async (amount: number) => {
    setIsLogging(true)
    await logWater(amount, 'button')
    setIsLogging(false)
  }

  const handlePhotoLog = () => {
    // TODO: Implement photo recognition
    console.log('Photo logging not implemented yet')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Droplets className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    )
  }

  const progressPercentage = getProgressPercentage()
  const remainingAmount = getRemainingAmount()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Droplets className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Hydrate-or-DIEdrate</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="hidden sm:flex">
              <Trophy className="w-3 h-3 mr-1" />
              {profile?.total_points || 0} pts
            </Badge>
            <Badge variant="outline" className="hidden sm:flex">
              <Zap className="w-3 h-3 mr-1" />
              {profile?.streak || 0} day streak
            </Badge>
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-2">
            Hey {profile?.full_name || user?.email?.split('@')[0]}! 👋
          </h2>
          <p className="text-muted-foreground">
            {progressPercentage >= 100 
              ? "Amazing! You've crushed your hydration goal today! 🎉"
              : `You need ${remainingAmount}ml more to reach your daily goal!`
            }
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center">
          <div className="flex bg-muted rounded-lg p-1">
            {[
              { key: 'overview', label: 'Overview', icon: Target },
              { key: 'voice', label: 'Voice Log', icon: Camera },
              { key: 'coach', label: 'AI Coach', icon: Zap },
              { key: 'chart', label: 'Chart', icon: Trophy },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeTab === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(key as any)}
                className="flex items-center space-x-1"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Main Progress Card */}
              <Card className="relative overflow-hidden border-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <CardContent className="relative p-8">
                  <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0 lg:space-x-8">
                    
                    {/* Water Wave Visualization */}
                    <div className="flex-shrink-0">
                      <WaterWave 
                        fillPercentage={progressPercentage} 
                        size="xl"
                        className="shadow-lg"
                      />
                    </div>

                    {/* Progress Details */}
                    <div className="flex-1 space-y-4 text-center lg:text-left">
                      <div>
                        <div className="flex items-center justify-center lg:justify-start space-x-2 mb-2">
                          <Target className="w-5 h-5 text-primary" />
                          <span className="text-sm text-muted-foreground">Daily Goal Progress</span>
                        </div>
                        <div className="text-4xl font-bold mb-1">
                          {todayTotal}<span className="text-lg text-muted-foreground">ml</span>
                        </div>
                        <div className="text-muted-foreground">
                          of {profile?.daily_goal || 2000}ml goal
                        </div>
                      </div>
                      
                      <Progress value={progressPercentage} className="h-3" />
                      
                      <div className="flex justify-center lg:justify-start space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span>Consumed: {todayTotal}ml</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-muted rounded-full" />
                          <span>Remaining: {remainingAmount}ml</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Log Buttons */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Quick Log Water</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickLogAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        className="h-16 flex flex-col space-y-1 hover:bg-primary/10 hover:border-primary/30"
                        onClick={() => handleQuickLog(amount)}
                        disabled={isLogging}
                      >
                        <Droplets className="w-5 h-5 text-primary" />
                        <span className="font-semibold">{amount}ml</span>
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full h-12"
                    onClick={handlePhotoLog}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Photo Recognition (Coming Soon)
                  </Button>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-hydration-success to-green-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-hydration-success mb-1">
                      {profile?.streak || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Day Streak</div>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-3">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">
                      {profile?.total_points || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-hydration-warning to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-hydration-warning mb-1">
                      {profile?.daily_goal || 0}ml
                    </div>
                    <div className="text-sm text-muted-foreground">Daily Goal</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'voice' && <VoiceLogger />}
          {activeTab === 'coach' && <AICoach />}
          {activeTab === 'chart' && <HydrationChart />}
        </motion.div>
      </main>
    </div>
  )
}