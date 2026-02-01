'use client';

import { UserBadge } from '@/hooks/useChannelJoin';
import Modal from '@/components/ui/Modal';

// Tier info for display
const TIER_INFO: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: 'Bronze', icon: '🥉', color: 'from-amber-700 to-amber-600' },
  2: { name: 'Silver', icon: '🥈', color: 'from-gray-400 to-gray-300' },
  3: { name: 'Gold', icon: '🥇', color: 'from-yellow-500 to-yellow-400' },
  4: { name: 'Diamond', icon: '💎', color: 'from-cyan-400 to-blue-400' },
  5: { name: 'Legendary', icon: '👑', color: 'from-purple-500 to-pink-500' },
};

interface BadgeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  badges: UserBadge[];
  channelName: string;
  requiredTier: number;
  onSelect: (badge: UserBadge) => void;
}

export function BadgeSelectorModal({
  isOpen,
  onClose,
  badges,
  channelName,
  requiredTier,
  onSelect,
}: BadgeSelectorModalProps) {
  // Sort badges by badge ID (most recent first)
  const sortedBadges = [...badges].sort((a, b) =>
    Number(b.badgeId) - Number(a.badgeId)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Badge" size="md">
      <div className="space-y-4">
        {/* Channel info */}
        <div className="p-3 rounded-lg bg-bg-primary border border-border-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Joining: {channelName}</p>
              <p className="text-xs text-text-muted">
                Requires {TIER_INFO[requiredTier]?.name || `Tier ${requiredTier}`}+ badge
              </p>
            </div>
            <div className="text-2xl">{TIER_INFO[requiredTier]?.icon || '🎫'}</div>
          </div>
        </div>

        {/* Badge list */}
        <div className="space-y-2">
          <p className="text-xs text-text-muted uppercase tracking-wider">
            Your Badges ({badges.length})
          </p>

          {sortedBadges.map((badge) => {
            // Estimate tier from MongoDB or default to 1
            // Since tier is encrypted, we show badge ID instead
            const badgeIdNum = Number(badge.badgeId);

            return (
              <button
                key={badge.pda.toBase58()}
                onClick={() => onSelect(badge)}
                className="w-full p-4 rounded-xl bg-bg-tertiary border border-border-primary hover:border-neon-green/50 hover:bg-bg-elevated transition-all group text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 border border-neon-green/30 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                      🐋
                    </div>
                    <div>
                      <p className="font-medium text-text-primary group-hover:text-neon-green transition-colors">
                        Badge #{badgeIdNum}
                      </p>
                      <p className="text-xs text-text-muted font-mono">
                        {badge.pda.toBase58().slice(0, 8)}...{badge.pda.toBase58().slice(-6)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {badge.data.isActive ? (
                      <span className="px-2 py-1 rounded text-[10px] bg-neon-green/10 text-neon-green border border-neon-green/30">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-[10px] bg-error/10 text-error border border-error/30">
                        INACTIVE
                      </span>
                    )}
                    <svg className="w-5 h-5 text-text-muted group-hover:text-neon-green transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Show tier proofs status */}
                <div className="mt-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((tier) => {
                    const tierInfo = TIER_INFO[tier];
                    // We can't know the actual tier without decrypting, so show all as possible
                    return (
                      <div
                        key={tier}
                        className="w-6 h-6 rounded flex items-center justify-center text-xs bg-bg-primary border border-border-secondary"
                        title={`${tierInfo.name} proof encrypted`}
                      >
                        {tierInfo.icon}
                      </div>
                    );
                  })}
                  <span className="text-[10px] text-text-muted ml-2">
                    Tier encrypted (INCO FHE)
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-neon-green/5 to-neon-cyan/5 border border-neon-green/20">
          <div className="flex items-start gap-2">
            <span className="text-neon-green">🔒</span>
            <div>
              <p className="text-xs font-medium text-neon-green">Privacy-First Identity</p>
              <p className="text-[10px] text-text-muted mt-0.5">
                Your badge PDA will be used as your identity in this channel.
                Your wallet address remains hidden from other members.
              </p>
            </div>
          </div>
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className="w-full py-2 px-4 rounded-lg bg-bg-primary border border-border-secondary text-text-muted hover:text-text-primary hover:border-border-primary transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export default BadgeSelectorModal;
