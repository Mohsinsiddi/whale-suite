'use client';

import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react';

interface RankBadgeProps {
  rank: number;
  totalUsers?: number;
  percentile?: number;
  trend?: number; // positive = moved up, negative = moved down
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export default function RankBadge({
  rank,
  totalUsers,
  percentile,
  trend,
  size = 'md',
  showDetails = true,
  className = '',
}: RankBadgeProps) {
  const sizes = {
    sm: { icon: 'w-4 h-4', rank: 'text-lg', label: 'text-xs', padding: 'px-2 py-1' },
    md: { icon: 'w-5 h-5', rank: 'text-2xl', label: 'text-sm', padding: 'px-3 py-2' },
    lg: { icon: 'w-8 h-8', rank: 'text-4xl', label: 'text-base', padding: 'px-4 py-3' },
  };

  const s = sizes[size];

  // Determine style based on rank
  const getRankStyle = () => {
    if (rank === 1) {
      return {
        bg: 'bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-yellow-500/50',
        icon: <Crown className={`${s.icon} text-yellow-400`} />,
        textColor: 'text-yellow-400',
        label: '1st Place',
        glow: 'shadow-yellow-500/20',
      };
    }
    if (rank === 2) {
      return {
        bg: 'bg-gradient-to-br from-gray-400/20 to-gray-500/20 border-gray-400/50',
        icon: <Medal className={`${s.icon} text-gray-300`} />,
        textColor: 'text-gray-300',
        label: '2nd Place',
        glow: '',
      };
    }
    if (rank === 3) {
      return {
        bg: 'bg-gradient-to-br from-amber-600/20 to-amber-700/20 border-amber-600/50',
        icon: <Award className={`${s.icon} text-amber-500`} />,
        textColor: 'text-amber-500',
        label: '3rd Place',
        glow: '',
      };
    }
    if (rank <= 10) {
      return {
        bg: 'bg-gradient-to-br from-neon-green/10 to-neon-cyan/10 border-neon-green/30',
        icon: <Trophy className={`${s.icon} text-neon-green`} />,
        textColor: 'text-neon-green',
        label: 'Top 10',
        glow: '',
      };
    }
    if (rank <= 100) {
      return {
        bg: 'bg-bg-elevated border-border-primary',
        icon: <Trophy className={`${s.icon} text-neon-cyan`} />,
        textColor: 'text-neon-cyan',
        label: 'Top 100',
        glow: '',
      };
    }
    return {
      bg: 'bg-bg-elevated border-border-primary',
      icon: <Trophy className={`${s.icon} text-text-muted`} />,
      textColor: 'text-text-primary',
      label: '',
      glow: '',
    };
  };

  const style = getRankStyle();

  return (
    <motion.div
      className={`inline-flex items-center gap-3 ${s.padding} rounded-xl border ${style.bg} ${style.glow} ${className}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={rank <= 3 ? { scale: 1.02 } : {}}
    >
      {/* Rank icon */}
      <div className="flex items-center justify-center">
        {style.icon}
      </div>

      {/* Rank number */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`${s.rank} font-bold ${style.textColor}`}>
            #{rank}
          </span>
          {trend !== undefined && trend !== 0 && (
            <span className={`flex items-center gap-0.5 ${trend > 0 ? 'text-success' : 'text-error'}`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="text-xs">{Math.abs(trend)}</span>
            </span>
          )}
        </div>

        {showDetails && (
          <div className={`${s.label} text-text-muted`}>
            {style.label ? (
              <span className={style.textColor}>{style.label}</span>
            ) : totalUsers ? (
              <span>of {totalUsers.toLocaleString()} users</span>
            ) : percentile !== undefined ? (
              <span>Top {100 - percentile}%</span>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Compact inline rank
export function RankInline({ rank, className = '' }: { rank: number; className?: string }) {
  const color = rank === 1
    ? 'text-yellow-400'
    : rank === 2
      ? 'text-gray-300'
      : rank === 3
        ? 'text-amber-500'
        : rank <= 10
          ? 'text-neon-green'
          : 'text-text-secondary';

  return (
    <span className={`font-mono font-bold ${color} ${className}`}>
      #{rank}
    </span>
  );
}
