'use client';

import { motion } from 'framer-motion';
import { Trophy, Flame, Shield, TrendingUp, Crown, Medal, Award } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { AddressAvatar } from '@/components/ui/Avatar';
import type { LeaderboardEntry } from '@/hooks/useLeaderboard';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserWallet?: string;
  loading?: boolean;
  showPodium?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// Badge tier colors
const BADGE_COLORS: Record<string, string> = {
  none: 'text-text-muted',
  bronze: 'text-amber-600',
  silver: 'text-gray-400',
  gold: 'text-yellow-400',
  diamond: 'text-cyan-400',
  legendary: 'text-purple-400',
};

// Rank icons for top 3
function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="text-text-muted font-mono">#{rank}</span>;
}

// Podium display for top 3
function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length < 3) return null;

  const [first, second, third] = entries;

  return (
    <div className="flex items-end justify-center gap-4 mb-8 px-4">
      {/* Second place */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-2">
          <AddressAvatar address={second.wallet} size="lg" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold text-white border-2 border-bg-primary">
            2
          </div>
        </div>
        <p className="text-sm font-medium text-text-primary truncate max-w-[80px]">{second.displayName}</p>
        <p className="text-xs text-text-muted">{second.points.toLocaleString()} pts</p>
        <div className="w-20 h-16 bg-gradient-to-t from-gray-600 to-gray-500 rounded-t-lg mt-2" />
      </motion.div>

      {/* First place */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-2">
          <Crown className="w-6 h-6 text-yellow-400 absolute -top-6 left-1/2 -translate-x-1/2 z-10" />
          <AddressAvatar address={first.wallet} size="xl" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-sm font-bold text-white border-2 border-bg-primary shadow-lg shadow-yellow-500/30">
            1
          </div>
        </div>
        <p className="text-sm font-bold text-text-primary truncate max-w-[100px]">{first.displayName}</p>
        <p className="text-xs text-neon-green font-medium">{first.points.toLocaleString()} pts</p>
        <div className="w-24 h-24 bg-gradient-to-t from-yellow-600 to-yellow-500 rounded-t-lg mt-2" />
      </motion.div>

      {/* Third place */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-2">
          <AddressAvatar address={third.wallet} size="lg" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold text-white border-2 border-bg-primary">
            3
          </div>
        </div>
        <p className="text-sm font-medium text-text-primary truncate max-w-[80px]">{third.displayName}</p>
        <p className="text-xs text-text-muted">{third.points.toLocaleString()} pts</p>
        <div className="w-20 h-12 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg mt-2" />
      </motion.div>
    </div>
  );
}

export default function LeaderboardTable({
  entries,
  currentUserWallet,
  loading,
  showPodium = true,
  onLoadMore,
  hasMore,
}: LeaderboardTableProps) {
  if (loading && entries.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-bg-elevated rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-muted">No leaderboard data yet</p>
        <p className="text-text-muted/70 text-sm">Start earning points to appear here!</p>
      </div>
    );
  }

  const podiumEntries = showPodium ? entries.slice(0, 3) : [];
  const tableEntries = showPodium ? entries.slice(3) : entries;

  return (
    <div>
      {/* Podium for top 3 */}
      {showPodium && podiumEntries.length >= 3 && <Podium entries={podiumEntries} />}

      {/* Table for remaining entries */}
      <div className="space-y-2">
        {tableEntries.map((entry, index) => {
          const isCurrentUser = entry.wallet === currentUserWallet;

          return (
            <motion.div
              key={entry.wallet}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`
                flex items-center gap-4 p-3 rounded-xl transition-all
                ${isCurrentUser
                  ? 'bg-neon-green/10 border border-neon-green/30'
                  : 'bg-bg-elevated hover:bg-bg-tertiary border border-transparent'
                }
              `}
            >
              {/* Rank */}
              <div className="w-10 flex justify-center">
                <RankIcon rank={entry.rank} />
              </div>

              {/* Avatar */}
              <AddressAvatar address={entry.wallet} size="sm" />

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium truncate ${isCurrentUser ? 'text-neon-green' : 'text-text-primary'}`}>
                    {entry.displayName}
                  </span>
                  {entry.badgeTier !== 'none' && (
                    <Badge variant="default" size="xs" className={BADGE_COLORS[entry.badgeTier]}>
                      {entry.badgeTier}
                    </Badge>
                  )}
                  {isCurrentUser && (
                    <Badge variant="success" size="xs">You</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {entry.transactionCount || 0} txs
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {entry.privacyScore} score
                  </span>
                </div>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-1 text-orange-400">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">{entry.streak}</span>
              </div>

              {/* Points */}
              <div className="text-right min-w-[80px]">
                <span className="text-lg font-bold text-neon-green">
                  {entry.points.toLocaleString()}
                </span>
                <p className="text-xs text-text-muted">points</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="w-full mt-4 py-3 text-sm text-text-secondary hover:text-neon-green transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
