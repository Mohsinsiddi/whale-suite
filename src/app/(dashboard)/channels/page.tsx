'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/privy/hooks';
import { useNetwork } from '@/hooks/useNetwork';
import { TIER_INFO, TIER_PRICES } from '@/hooks/useConfidentialBadge';
import { useRouter } from 'next/navigation';
import { PublicKey, Connection } from '@solana/web3.js';
import {
  fetchBadgeAccount,
  fetchConfigAccount,
  deriveBadgePda,
  deriveConfigPda,
  BadgeAccountData,
  ConfigAccountData,
} from '@/lib/contract/badge-sdk';

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
  tier: number;
  tierName: string;
  icon: string;
  memberCount: number;
  messageCount: number;
  userAccess: 'joined' | 'eligible' | 'locked';
}

// On-chain badge data
interface OnChainBadge {
  pda: string;
  tier: number;
  tierName: string;
  owner: string;
  amountPaid: number;
  isActive: boolean;
  proofs: {
    bronze: string;
    silver: string;
    gold: string;
    diamond: string;
    legendary: string;
  };
}

export default function ChannelsPage() {
  const router = useRouter();
  const { walletAddress, authenticated } = useAuth();
  const { network } = useNetwork();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [onChainBadge, setOnChainBadge] = useState<OnChainBadge | null>(null);
  const [config, setConfig] = useState<ConfigAccountData | null>(null);
  const [joiningChannel, setJoiningChannel] = useState<string | null>(null);

  // Fetch on-chain badge data directly from Devnet
  const fetchOnChainData = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_DEVNET_RPC || 'https://api.devnet.solana.com',
        'confirmed'
      );

      const userPubkey = new PublicKey(walletAddress);
      const [badgePda] = deriveBadgePda(userPubkey);
      const [configPda] = deriveConfigPda();

      // Fetch config and badge in parallel
      const [badgeData, configData] = await Promise.all([
        fetchBadgeAccount(connection, badgePda),
        fetchConfigAccount(connection, configPda),
      ]);

      if (configData) {
        setConfig(configData);
      }

      if (badgeData && badgeData.isActive) {
        const tierNum = badgeData.tier;
        setOnChainBadge({
          pda: badgePda.toBase58(),
          tier: tierNum,
          tierName: TIER_INFO[tierNum as keyof typeof TIER_INFO]?.name || 'Unknown',
          owner: badgeData.owner.toBase58(),
          amountPaid: badgeData.amountPaid,
          isActive: badgeData.isActive,
          proofs: {
            bronze: badgeData.proofBronze,
            silver: badgeData.proofSilver,
            gold: badgeData.proofGold,
            diamond: badgeData.proofDiamond,
            legendary: badgeData.proofLegendary,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch on-chain data:', error);
    }
  }, [walletAddress]);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const res = await fetch(`/api/channels?wallet=${walletAddress}`);
      const data = await res.json();
      if (data.success) {
        setChannels(data.channels);
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    Promise.all([fetchOnChainData(), fetchChannels()]);
  }, [fetchOnChainData, fetchChannels]);

  // Handle join channel
  const handleJoinChannel = async (channel: Channel) => {
    if (!walletAddress) return;

    if (channel.userAccess === 'joined') {
      router.push(`/channels/${channel.slug}`);
      return;
    }

    if (channel.userAccess === 'locked') {
      // Show badge required message
      return;
    }

    setJoiningChannel(channel.id);

    try {
      const res = await fetch(`/api/channels/${channel.slug}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchChannels();
        router.push(`/channels/${channel.slug}`);
      }
    } catch (error) {
      console.error('Failed to join channel:', error);
    } finally {
      setJoiningChannel(null);
    }
  };

  // Render loading state
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-lg font-bold text-text-primary mb-1">Connect Wallet</h2>
          <p className="text-text-muted text-sm">Connect your wallet to access channels</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Private Channels</h1>
          <p className="text-text-muted text-sm">Tier-gated messaging with INCO FHE proofs</p>
        </div>
        {config && (
          <div className="text-xs text-text-muted">
            <span className="text-neon-green">{config.totalBadges}</span> badges claimed
          </div>
        )}
      </div>

      {/* On-Chain Badge Status - Compact Card */}
      {onChainBadge ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-gradient-to-r from-bg-tertiary to-bg-secondary border border-neon-green/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${TIER_INFO[onChainBadge.tier as keyof typeof TIER_INFO]?.color || 'from-gray-500 to-gray-400'} flex items-center justify-center text-2xl`}>
                {TIER_INFO[onChainBadge.tier as keyof typeof TIER_INFO]?.icon || '🎫'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary">{onChainBadge.tierName} Whale</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-neon-green/10 text-neon-green border border-neon-green/30">ON-CHAIN</span>
                </div>
                <p className="text-xs text-text-muted">
                  Paid {(onChainBadge.amountPaid / 1e9).toFixed(2)} SOL • Access to {onChainBadge.tier} tier{onChainBadge.tier > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <a
                href={`https://explorer.solana.com/address/${onChainBadge.pda}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neon-cyan hover:underline"
              >
                View on Explorer →
              </a>
            </div>
          </div>

          {/* Compact Proofs Display */}
          <div className="mt-3 pt-3 border-t border-border-secondary">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-text-muted">INCO Proofs:</span>
              {[1, 2, 3, 4, 5].map((t) => {
                const hasAccess = onChainBadge.tier >= t;
                const tierInfo = TIER_INFO[t as keyof typeof TIER_INFO];
                return (
                  <div
                    key={t}
                    className={`flex items-center gap-1 ${hasAccess ? 'text-neon-green' : 'text-text-muted opacity-50'}`}
                    title={`${tierInfo.name}: ${hasAccess ? 'Verified' : 'Locked'}`}
                  >
                    <span>{tierInfo.icon}</span>
                    <span className={hasAccess ? '' : 'line-through'}>{tierInfo.name.charAt(0)}</span>
                    {hasAccess && <CheckIcon className="w-3 h-3" />}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      ) : (
        /* No Badge - Compact CTA */
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-bg-tertiary border border-border-primary"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🐋</span>
              <div>
                <p className="font-medium text-text-primary">No Badge Found</p>
                <p className="text-xs text-text-muted">Claim a badge on Devnet to access tier-gated channels</p>
              </div>
            </div>
            <a
              href="/badges"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary text-sm font-medium hover:shadow-glow-sm transition-all"
            >
              Claim Badge
            </a>
          </div>

          {/* Tier Prices */}
          <div className="mt-3 pt-3 border-t border-border-secondary flex items-center gap-3 text-xs">
            {Object.entries(TIER_INFO).map(([tierNum, info]) => (
              <div key={tierNum} className="flex items-center gap-1 text-text-muted">
                <span>{info.icon}</span>
                <span>{TIER_PRICES[parseInt(tierNum) as keyof typeof TIER_PRICES]} SOL</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Channels Grid - Improved Compact Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((channel, index) => {
          const isLocked = channel.userAccess === 'locked';
          const isJoined = channel.userAccess === 'joined';
          const canAccess = onChainBadge && onChainBadge.tier >= channel.tier;

          return (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !isLocked && handleJoinChannel(channel)}
              className={`relative p-4 rounded-xl border cursor-pointer transition-all group ${
                isLocked && !canAccess
                  ? 'bg-bg-tertiary/50 border-border-secondary opacity-60 cursor-not-allowed'
                  : isJoined
                  ? 'bg-bg-tertiary border-neon-green/40 hover:border-neon-green hover:shadow-glow-sm'
                  : canAccess
                  ? 'bg-bg-tertiary border-neon-cyan/40 hover:border-neon-cyan'
                  : 'bg-bg-tertiary border-border-primary hover:border-border-focus'
              }`}
            >
              {/* Channel Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{channel.icon}</span>
                  <div>
                    <h3 className="font-semibold text-text-primary text-sm leading-tight">{channel.name}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      channel.tier <= (onChainBadge?.tier || 0)
                        ? 'bg-neon-green/10 text-neon-green'
                        : 'bg-bg-secondary text-text-muted'
                    }`}>
                      {channel.tierName}+
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                {isJoined ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green">Joined</span>
                ) : isLocked && !canAccess ? (
                  <LockIcon className="w-4 h-4 text-text-muted" />
                ) : canAccess ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan">Eligible</span>
                ) : null}
              </div>

              {/* Description */}
              <p className="text-xs text-text-secondary mb-3 line-clamp-2">{channel.description}</p>

              {/* Footer Stats */}
              <div className="flex items-center justify-between text-[10px] text-text-muted">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <UsersIcon className="w-3 h-3" />
                    {channel.memberCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageIcon className="w-3 h-3" />
                    {channel.messageCount}
                  </span>
                </div>

                {/* Action */}
                {!isLocked || canAccess ? (
                  <span className={`text-[10px] font-medium ${isJoined ? 'text-neon-green' : 'text-neon-cyan'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {joiningChannel === channel.id ? 'Joining...' : isJoined ? 'Enter →' : 'Join →'}
                  </span>
                ) : (
                  <span className="text-[10px] text-text-muted">
                    Requires {channel.tierName}
                  </span>
                )}
              </div>

              {/* Lock Overlay */}
              {isLocked && !canAccess && (
                <div className="absolute inset-0 rounded-xl bg-bg-primary/60 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="text-center">
                    <LockIcon className="w-5 h-5 text-text-muted mx-auto mb-1" />
                    <p className="text-xs text-text-muted">{channel.tierName}+ Required</p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {channels.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl block mb-2">📭</span>
          <p className="text-text-muted">No channels available</p>
        </div>
      )}

      {/* Debug Info (dev only) */}
      {process.env.NODE_ENV === 'development' && onChainBadge && (
        <details className="mt-8 p-4 rounded-xl bg-bg-tertiary border border-border-secondary text-xs">
          <summary className="cursor-pointer text-text-muted mb-2">Debug: On-Chain Badge Data</summary>
          <pre className="overflow-auto text-text-secondary">
            {JSON.stringify(onChainBadge, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

// Icons
const UsersIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const MessageIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

const LockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
