"use client";

interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gradient" | "stealth";
  showValue?: boolean;
  animated?: boolean;
  label?: string;
}

export default function Progress({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showValue = false,
  animated = true,
  label,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variants = {
    default: "bg-neon-green",
    gradient: "bg-gradient-to-r from-neon-green to-neon-cyan",
    stealth: "bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green bg-[length:200%_100%]",
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-text-secondary">{label}</span>}
          {showValue && (
            <span className="text-xs font-medium text-neon-green">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={`relative w-full ${sizes[size]} bg-bg-primary rounded-full overflow-hidden`}>
        {/* Track glow */}
        <div className="absolute inset-0 bg-neon-green/5 rounded-full" />

        {/* Fill */}
        <div
          className={`
            absolute inset-y-0 left-0 rounded-full
            ${variants[variant]}
            ${animated ? "transition-all duration-500 ease-out" : ""}
            ${variant === "stealth" && animated ? "animate-shimmer" : ""}
          `}
          style={{ width: `${percentage}%` }}
        />

        {/* Glow effect */}
        <div
          className={`
            absolute inset-y-0 left-0 rounded-full blur-sm opacity-50
            ${variants[variant]}
            ${animated ? "transition-all duration-500 ease-out" : ""}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Circular Progress
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  label?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  showValue = true,
  label,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-bg-primary"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
          style={{ filter: "drop-shadow(0 0 6px rgba(0, 255, 136, 0.5))" }}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ff88" />
            <stop offset="100%" stopColor="#00d4ff" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      {(showValue || label) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showValue && (
            <span className="text-lg font-bold text-neon-green">{Math.round(percentage)}</span>
          )}
          {label && (
            <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Stealth Rating Progress (Special design)
interface StealthRatingProps {
  score: number;
  maxScore?: number;
}

export function StealthRating({ score, maxScore = 1000 }: StealthRatingProps) {
  const percentage = (score / maxScore) * 100;

  const getLevel = () => {
    if (percentage >= 80) return { label: "Phantom", color: "text-neon-green" };
    if (percentage >= 60) return { label: "Shadow", color: "text-neon-cyan" };
    if (percentage >= 40) return { label: "Ghost", color: "text-neon-teal" };
    if (percentage >= 20) return { label: "Stealth", color: "text-warning" };
    return { label: "Visible", color: "text-error" };
  };

  const level = getLevel();

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-text-secondary">Stealth Rating</span>
        <span className={`text-xs font-semibold ${level.color}`}>{level.label}</span>
      </div>

      <div className="relative h-3 bg-bg-primary rounded-full overflow-hidden">
        {/* Segments */}
        <div className="absolute inset-0 flex">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 border-r border-bg-secondary last:border-r-0" />
          ))}
        </div>

        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green bg-[length:200%_100%] animate-shimmer rounded-full transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />

        {/* Glow */}
        <div
          className="absolute inset-y-0 left-0 bg-neon-green/30 blur-sm rounded-full transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-text-muted">
        <span>0</span>
        <span className="text-neon-green font-medium">{score}</span>
        <span>{maxScore}</span>
      </div>
    </div>
  );
}
