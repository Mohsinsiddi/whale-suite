'use client';

import { motion } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';

interface StreakCounterProps {
  streak: number;
  isActiveToday?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function StreakCounter({
  streak,
  isActiveToday = true,
  size = 'md',
  showLabel = true,
  className = '',
}: StreakCounterProps) {
  const sizes = {
    sm: { icon: 'w-4 h-4', text: 'text-lg', label: 'text-xs', padding: 'px-2 py-1' },
    md: { icon: 'w-5 h-5', text: 'text-2xl', label: 'text-sm', padding: 'px-3 py-2' },
    lg: { icon: 'w-6 h-6', text: 'text-3xl', label: 'text-base', padding: 'px-4 py-3' },
  };

  const s = sizes[size];

  // Streak milestones for special effects
  const isMilestone = streak >= 7;
  const isOnFire = streak >= 30;

  const flameColor = isOnFire
    ? 'text-purple-400'
    : isMilestone
      ? 'text-orange-400'
      : streak > 0
        ? 'text-amber-500'
        : 'text-text-muted';

  const bgColor = isOnFire
    ? 'bg-purple-500/10 border-purple-500/30'
    : isMilestone
      ? 'bg-orange-500/10 border-orange-500/30'
      : streak > 0
        ? 'bg-amber-500/10 border-amber-500/30'
        : 'bg-bg-elevated border-border-primary';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className={`inline-flex items-center gap-2 ${s.padding} rounded-xl border ${bgColor}`}
        animate={isActiveToday && streak > 0 ? {
          scale: [1, 1.02, 1],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          animate={streak > 0 ? {
            rotate: [-5, 5, -5],
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
        >
          <Flame className={`${s.icon} ${flameColor}`} />
        </motion.div>

        <span className={`${s.text} font-bold ${flameColor}`}>
          {streak}
        </span>

        {isOnFire && (
          <Zap className="w-4 h-4 text-yellow-400" />
        )}
      </motion.div>

      {showLabel && (
        <div>
          <p className={`${s.label} text-text-primary font-medium`}>
            {streak === 0 ? 'No streak' : streak === 1 ? 'Day streak' : 'Day streak'}
          </p>
          {!isActiveToday && streak > 0 && (
            <p className="text-xs text-warning">
              Complete activity today!
            </p>
          )}
          {isOnFire && (
            <p className="text-xs text-purple-400">
              On fire! 🔥
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Compact badge version
export function StreakBadge({ streak, className = '' }: { streak: number; className?: string }) {
  if (streak === 0) return null;

  const color = streak >= 30
    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    : streak >= 7
      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      : 'bg-amber-500/20 text-amber-500 border-amber-500/30';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${color} ${className}`}>
      <Flame className="w-3 h-3" />
      <span className="text-xs font-medium">{streak}</span>
    </span>
  );
}
