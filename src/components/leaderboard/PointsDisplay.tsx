'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PointsDisplayProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  trend?: number; // positive = up, negative = down, 0 = neutral
  animate?: boolean;
  className?: string;
}

export default function PointsDisplay({
  points,
  size = 'md',
  showLabel = true,
  showIcon = true,
  trend,
  animate = true,
  className = '',
}: PointsDisplayProps) {
  const sizes = {
    sm: { text: 'text-lg', icon: 'w-4 h-4', label: 'text-xs' },
    md: { text: 'text-2xl', icon: 'w-5 h-5', label: 'text-sm' },
    lg: { text: 'text-4xl', icon: 'w-6 h-6', label: 'text-base' },
  };

  const s = sizes[size];

  const TrendIcon = trend && trend > 0
    ? TrendingUp
    : trend && trend < 0
      ? TrendingDown
      : Minus;

  const trendColor = trend && trend > 0
    ? 'text-success'
    : trend && trend < 0
      ? 'text-error'
      : 'text-text-muted';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <motion.div
          animate={animate ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >
          <Sparkles className={`${s.icon} text-neon-green`} />
        </motion.div>
      )}

      <div>
        <AnimatePresence mode="wait">
          <motion.span
            key={points}
            initial={animate ? { scale: 1.2, color: '#00ff88' } : {}}
            animate={{ scale: 1, color: '#e8f4f8' }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`${s.text} font-bold text-text-primary`}
          >
            {points.toLocaleString()}
          </motion.span>
        </AnimatePresence>

        {showLabel && (
          <p className={`${s.label} text-text-muted`}>points</p>
        )}
      </div>

      {trend !== undefined && (
        <div className={`flex items-center gap-0.5 ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          {trend !== 0 && (
            <span className="text-xs font-medium">
              {trend > 0 ? '+' : ''}{trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Compact inline version
export function PointsBadge({ points, className = '' }: { points: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/30 ${className}`}>
      <Sparkles className="w-3 h-3 text-neon-green" />
      <span className="text-xs font-medium text-neon-green">{points.toLocaleString()}</span>
    </span>
  );
}

// Points earned animation
export function PointsEarned({
  points,
  action,
  onComplete,
}: {
  points: number;
  action: string;
  onComplete?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      onAnimationComplete={onComplete}
      className="fixed bottom-24 right-6 z-50 bg-bg-secondary border border-neon-green/50 rounded-xl p-4 shadow-lg shadow-neon-green/20"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-neon-green/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-neon-green" />
        </div>
        <div>
          <p className="text-neon-green font-bold text-lg">+{points} points</p>
          <p className="text-text-muted text-xs">{action}</p>
        </div>
      </div>
    </motion.div>
  );
}
