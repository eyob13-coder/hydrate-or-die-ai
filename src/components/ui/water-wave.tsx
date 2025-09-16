import { cn } from "@/lib/utils"

interface WaterWaveProps {
  fillPercentage: number
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function WaterWave({ fillPercentage, className, size = "md" }: WaterWaveProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32",
    xl: "w-48 h-48"
  }

  const waveHeight = Math.max(100 - fillPercentage, 10)

  return (
    <div className={cn(
      "relative rounded-full overflow-hidden bg-gradient-to-b from-primary/20 to-primary/10 border-2 border-primary/30",
      sizeClasses[size],
      className
    )}>
      {/* Water fill */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-primary/80 transition-all duration-1000 ease-out"
        style={{ height: `${fillPercentage}%` }}
      >
        {/* Wave animation */}
        <div className="absolute inset-x-0 top-0 h-2 opacity-60">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-wave"
            style={{ 
              transform: `translateY(${waveHeight}%)`,
              background: `repeating-linear-gradient(
                90deg,
                transparent,
                rgba(255,255,255,0.3) 20px,
                transparent 40px
              )`
            }}
          />
        </div>
      </div>
      
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground drop-shadow-sm">
          {Math.round(fillPercentage)}%
        </span>
      </div>
    </div>
  )
}