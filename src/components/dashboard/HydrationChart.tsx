import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useHydration } from '@/hooks/useHydration'
import { TrendingUp } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export function HydrationChart() {
  const { logs, profile } = useHydration()

  const chartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const hourlyTotals = hours.map(hour => {
      const hourLogs = logs.filter(log => {
        const logHour = new Date(log.logged_at).getHours()
        return logHour === hour
      })
      return hourLogs.reduce((sum, log) => sum + log.amount, 0)
    })

    const cumulativeData = hourlyTotals.reduce((acc, current, index) => {
      const previous = index > 0 ? acc[index - 1] : 0
      acc.push(previous + current)
      return acc
    }, [] as number[])

    return {
      labels: hours.map(h => `${h}:00`),
      datasets: [
        {
          label: 'Cumulative Intake (ml)',
          data: cumulativeData,
          borderColor: 'hsl(var(--primary))',
          backgroundColor: 'hsl(var(--primary) / 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'hsl(var(--primary))',
          pointBorderColor: 'hsl(var(--primary-foreground))',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Daily Goal',
          data: hours.map(() => profile?.daily_goal || 2000),
          borderColor: 'hsl(var(--hydration-success))',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0,
        },
      ],
    }
  }, [logs, profile])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: 'hsl(var(--foreground))',
        },
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}ml`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'hsl(var(--border))',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          maxRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'hsl(var(--border))',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          callback: function(value: any) {
            return `${value}ml`
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  const todayTotal = useMemo(() => {
    return logs.reduce((sum, log) => sum + log.amount, 0)
  }, [logs])

  const averagePerHour = useMemo(() => {
    const currentHour = new Date().getHours()
    return currentHour > 0 ? Math.round(todayTotal / currentHour) : 0
  }, [todayTotal])

  const projectedTotal = useMemo(() => {
    if (averagePerHour === 0) return 0
    return averagePerHour * 16 // Assume 16 active hours per day
  }, [averagePerHour])

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span>Today's Hydration Timeline</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="h-64 mb-6">
          <Line data={chartData} options={options} />
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">{todayTotal}ml</div>
            <div className="text-xs text-muted-foreground">Current Total</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-hydration-accent">{averagePerHour}ml</div>
            <div className="text-xs text-muted-foreground">Per Hour Avg</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-hydration-success">{projectedTotal}ml</div>
            <div className="text-xs text-muted-foreground">Projected Total</div>
          </div>
        </div>

        {projectedTotal > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>
                {projectedTotal >= (profile?.daily_goal || 2000)
                  ? `🎉 You're on track to exceed your goal by ${projectedTotal - (profile?.daily_goal || 2000)}ml!`
                  : `⚡ Keep it up! You need ${Math.round((profile?.daily_goal || 2000) / 16 - averagePerHour)}ml more per hour to reach your goal.`
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}