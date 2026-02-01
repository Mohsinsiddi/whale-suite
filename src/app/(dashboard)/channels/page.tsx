'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/privy/hooks';
import { useNetwork } from '@/hooks/useNetwork';
import { useConfidentialBadge, TIER_INFO, TIER_PRICES } from '@/hooks/useConfidentialBadge';
import { useClaimBadge } from '@/hooks/useClaimBadge';
import { useChannelJoin } from '@/hooks/useChannelJoin';
import { useRouter } from 'next/navigation';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { PublicKey, Connection } from '@solana/web3.js';
import {
  fetchBadgeAccount,
  deriveBadgePda,
  deriveConfigPda,
  fetchConfigAccount,
  ConfigAccountData,
} from '@/lib/contract/badge-sdk';
import { JoinChannelModal } from '@/components/modals/JoinChannelModal';

type TabType = 'channels' | 'claim';

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

interface OnChainBadge {
  pda: string;
  badgeId: bigint;
  tier: number;
  tierName: string;
  owner: string;
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
  const { badge, loading: badgeLoading, refetch: refetchBadge } = useConfidentialBadge();
  const { balance, loading: balanceLoading } = useWalletBalance(walletAddress);
  const {
    claimBadge,
    upgradeTier,
    closeBadge,
    loading: claimLoading,
    error: claimError,
    txSignature,
    success: claimSuccess,
  } = useClaimBadge();

  // Channel join with INCO verification
  const {
    loading: joinLoading,
    steps: joinSteps,
    currentStep: joinCurrentStep,
    error: joinError,
    success: joinSuccess,
    anonId: joinAnonId,
    txSignature: joinTxSignature,
    joinChannel,
    reset: resetJoin,
  } = useChannelJoin();

  const [activeTab, setActiveTab] = useState<TabType>('channels');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [onChainBadge, setOnChainBadge] = useState<OnChainBadge | null>(null);
  const [config, setConfig] = useState<ConfigAccountData | null>(null);
  const [joiningChannel, setJoiningChannel] = useState<Channel | null>(null);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Auto-switch to claim tab if no badge (check both MongoDB AND on-chain)
  useEffect(() => {
    if (!badgeLoading && !badge?.hasClaimed && !onChainBadge?.isActive) {
      setActiveTab('claim');
    }
  }, [badge, badgeLoading, onChainBadge]);

  // Sync on-chain badge to MongoDB if missing
  const syncBadgeToMongo = useCallback(async (badgePda: string, tier: number, proofs: Record<string, string>) => {
    if (!walletAddress) return;

    try {
      // Check if already synced
      const checkRes = await fetch(`/api/badges/confidential?wallet=${walletAddress}`);
      const checkData = await checkRes.json();

      if (checkData.success && checkData.badge?.hasClaimed) {
        // Already synced, just refetch
        await refetchBadge();
        return;
      }

      // Sync to MongoDB
      await fetch('/api/badges/confidential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          txSignature: 'synced-from-chain',
          tier,
          tierName: TIER_INFO[tier as keyof typeof TIER_INFO]?.name || 'Unknown',
          badgeAccountAddress: badgePda,
          amountPaid: 0, // Unknown for synced badges
          proofHandles: proofs,
        }),
      });

      // Refetch MongoDB badge
      await refetchBadge();
    } catch (err) {
      console.error('Failed to sync badge to MongoDB:', err);
    }
  }, [walletAddress, refetchBadge]);

  // Fetch on-chain badge data
  const fetchOnChainData = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_DEVNET_RPC || 'https://api.devnet.solana.com',
        'confirmed'
      );

      const userPubkey = new PublicKey(walletAddress);
      const [configPda] = deriveConfigPda();

      // Use MongoDB badgeAccountAddress if available, otherwise derive with badgeId=0
      let badgePda: PublicKey;
      if (badge?.badgeAccountAddress) {
        badgePda = new PublicKey(badge.badgeAccountAddress);
        console.log('[Channels] Using MongoDB badge PDA:', badgePda.toBase58());
      } else {
        [badgePda] = deriveBadgePda(userPubkey);
        console.log('[Channels] Deriving badge PDA (badgeId=0):', badgePda.toBase58());
      }

      console.log('[Channels] Checking badge for wallet:', walletAddress);

      const [badgeData, configData] = await Promise.all([
        fetchBadgeAccount(connection, badgePda),
        fetchConfigAccount(connection, configPda),
      ]);

      console.log('[Channels] On-chain badge data:', badgeData);
      console.log('[Channels] Config data:', configData);

      if (configData) setConfig(configData);

      if (badgeData && badgeData.isActive) {
        // Try to determine tier from the proof handles or use MongoDB data
        // Since tier is encrypted, we use MongoDB as source of truth for tier
        // But we know badge exists on-chain
        const tierNum = badge?.tier || 1;

        const onChainData = {
          pda: badgePda.toBase58(),
          badgeId: badgeData.badgeId,
          tier: tierNum,
          tierName: TIER_INFO[tierNum as keyof typeof TIER_INFO]?.name || 'Unknown',
          owner: badgeData.owner.toBase58(),
          isActive: badgeData.isActive,
          proofs: {
            bronze: badgeData.proofBronze,
            silver: badgeData.proofSilver,
            gold: badgeData.proofGold,
            diamond: badgeData.proofDiamond,
            legendary: badgeData.proofLegendary,
          },
        };

        setOnChainBadge(onChainData);

        // If on-chain badge exists but MongoDB doesn't have it, sync it
        if (!badge?.hasClaimed) {
          await syncBadgeToMongo(onChainData.pda, tierNum, onChainData.proofs);
        }
      } else {
        // Badge doesn't exist on-chain or is inactive
        console.log('[Channels] No active badge found on-chain');
        setOnChainBadge(null);

        // If MongoDB has a badge record but on-chain doesn't exist, clean up MongoDB
        if (badge?.hasClaimed) {
          console.log('[Channels] Cleaning up stale MongoDB badge record');
          try {
            await fetch('/api/badges/confidential', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ wallet: walletAddress }),
            });
            await refetchBadge();
          } catch (err) {
            console.error('Failed to clean up MongoDB badge:', err);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch on-chain data:', error);
      // On error fetching on-chain data (e.g., account doesn't exist), set to null
      setOnChainBadge(null);

      // If MongoDB has a badge record but on-chain doesn't exist, clean up MongoDB
      if (badge?.hasClaimed) {
        console.log('[Channels] On-chain fetch failed, cleaning up stale MongoDB badge record');
        try {
          await fetch('/api/badges/confidential', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet: walletAddress }),
          });
          await refetchBadge();
        } catch (err) {
          console.error('Failed to clean up MongoDB badge:', err);
        }
      }
    }
  }, [walletAddress, badge?.tier, badge?.hasClaimed, syncBadgeToMongo, refetchBadge]);

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

  // Handle claim or upgrade badge
  const handleClaimOrUpgrade = async () => {
    if (!walletAddress || claimLoading) return;

    let result;
    if (hasBadge && selectedTier > userTier) {
      // Upgrade existing badge (use badgeId 0 for first badge)
      result = await upgradeTier(selectedTier, userTier, BigInt(0));
    } else {
      // Claim new badge
      result = await claimBadge(selectedTier);
    }

    if (result.success) {
      // Refresh badge data
      await refetchBadge();
      await fetchOnChainData();
      await fetchChannels();
      setActiveTab('channels');
    }
  };

  // Handle join channel with INCO verification
  const handleJoinChannel = async (channel: Channel) => {
    if (!walletAddress) return;

    // If already joined, navigate directly
    if (channel.userAccess === 'joined') {
      router.push(`/channels/${channel.slug}`);
      return;
    }

    // If locked (tier too low), don't allow
    if (channel.userAccess === 'locked') return;

    // Open modal and start INCO join flow
    setJoiningChannel(channel);
    setShowJoinModal(true);
    resetJoin();

    // Start the join process
    const result = await joinChannel(channel.slug, channel.tier);

    if (result.success) {
      await fetchChannels();
    }
  };

  // Handle modal close
  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
    setJoiningChannel(null);
    resetJoin();
  };

  // Handle navigate to channel after successful join
  const handleNavigateToChannel = () => {
    if (joiningChannel) {
      router.push(`/channels/${joiningChannel.slug}`);
    }
    handleCloseJoinModal();
  };

  // Not authenticated
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

  const userTier = badge?.tier || onChainBadge?.tier || 0;
  const hasBadge = badge?.hasClaimed || onChainBadge?.isActive;

  // Debug info for development
  console.log('[Channels] Badge status:', {
    mongoDbBadge: badge,
    onChainBadge,
    userTier,
    hasBadge,
    badgeLoading,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Whale Channels</h1>
          <p className="text-text-muted text-sm">Tier-gated private messaging with INCO FHE</p>
        </div>
        {config && (
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span><span className="text-neon-green font-bold">{config.totalBadges}</span> badges claimed</span>
            <span className={`px-2 py-1 rounded ${network === 'devnet' ? 'bg-warning/10 text-warning' : 'bg-neon-green/10 text-neon-green'}`}>
              {network}
            </span>
          </div>
        )}
      </div>

      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 rounded-lg bg-bg-primary border border-border-secondary text-xs font-mono">
          <div className="flex items-center justify-between mb-2">
            <div className="text-text-muted">🔍 Debug Info:</div>
            {hasBadge && (
              <button
                onClick={async () => {
                  if (!confirm('Close badge and delete from MongoDB? This will allow you to test the full claim flow again.')) return;
                  // Get badgeId from on-chain badge data
                  const badgeId = onChainBadge?.badgeId ?? BigInt(0);
                  console.log('[Debug] Closing badge with ID:', badgeId.toString());
                  const result = await closeBadge(badgeId);
                  if (result.success) {
                    alert(`Badge closed! TX: ${result.txSignature?.slice(0, 20)}...`);
                    await refetchBadge();
                    window.location.reload();
                  } else {
                    alert(`Failed: ${result.error}`);
                  }
                }}
                disabled={claimLoading}
                className="px-3 py-1 rounded bg-error/20 text-error border border-error/30 hover:bg-error/30 transition-colors disabled:opacity-50"
              >
                {claimLoading ? 'Closing...' : '🗑️ Close Badge'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-text-muted">MongoDB badge:</span>{' '}
              <span className={badge?.hasClaimed ? 'text-neon-green' : 'text-error'}>
                {badge?.hasClaimed ? `Tier ${badge.tier} (${badge.tierName})` : 'None'}
              </span>
            </div>
            <div>
              <span className="text-text-muted">On-chain badge:</span>{' '}
              <span className={onChainBadge?.isActive ? 'text-neon-green' : 'text-error'}>
                {onChainBadge?.isActive ? `Active (PDA: ${onChainBadge.pda.slice(0, 8)}...)` : 'None'}
              </span>
            </div>
            <div>
              <span className="text-text-muted">hasBadge:</span>{' '}
              <span className={hasBadge ? 'text-neon-green' : 'text-error'}>{String(hasBadge)}</span>
            </div>
            <div>
              <span className="text-text-muted">userTier:</span>{' '}
              <span className="text-neon-cyan">{userTier}</span>
            </div>
          </div>
        </div>
      )}

      {/* Badge Status Bar */}
      {hasBadge && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-bg-tertiary to-bg-secondary border border-neon-green/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${TIER_INFO[userTier as keyof typeof TIER_INFO]?.color || 'from-gray-500 to-gray-400'} flex items-center justify-center text-2xl shadow-lg`}>
                {TIER_INFO[userTier as keyof typeof TIER_INFO]?.icon || '🎫'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary">{TIER_INFO[userTier as keyof typeof TIER_INFO]?.name} Whale</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-neon-green/10 text-neon-green border border-neon-green/30">VERIFIED</span>
                </div>
                <p className="text-xs text-text-muted">
                  Access to {userTier} tier{userTier > 1 ? 's' : ''} • All proofs encrypted
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((t) => {
                const hasAccess = userTier >= t;
                const info = TIER_INFO[t as keyof typeof TIER_INFO];
                return (
                  <div
                    key={t}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      hasAccess ? 'bg-neon-green/20 border border-neon-green/40' : 'bg-bg-primary/50 opacity-40'
                    }`}
                    title={`${info.name}: ${hasAccess ? 'Unlocked' : 'Locked'}`}
                  >
                    {info.icon}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-border-primary">
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'channels'
              ? 'border-neon-green text-neon-green'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-2">
            <ChannelsIcon className="w-4 h-4" />
            Channels
            {hasBadge && <span className="px-1.5 py-0.5 rounded text-[10px] bg-neon-green/10">{channels.length}</span>}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('claim')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'claim'
              ? 'border-neon-cyan text-neon-cyan'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-2">
            <BadgeIcon className="w-4 h-4" />
            {hasBadge ? 'Upgrade Badge' : 'Claim Badge'}
            {!hasBadge && <span className="px-1.5 py-0.5 rounded text-[10px] bg-neon-cyan/20 text-neon-cyan">Required</span>}
          </span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <motion.div
            key="channels"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {!hasBadge ? (
              <div className="text-center py-12 bg-bg-tertiary rounded-xl border border-border-primary">
                <div className="text-5xl mb-4">🐋</div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Badge Required</h3>
                <p className="text-text-muted text-sm mb-4">Claim a badge to access tier-gated channels</p>
                <button
                  onClick={() => setActiveTab('claim')}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary font-medium"
                >
                  Claim Badge
                </button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full" />
              </div>
            ) : (
              /* Channels Table */
              <div className="bg-bg-tertiary rounded-xl border border-border-primary overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-secondary">
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Channel</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">Tier</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Members</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Messages</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-secondary">
                    {channels.map((channel) => {
                      const isLocked = channel.userAccess === 'locked' && userTier < channel.tier;
                      const isJoined = channel.userAccess === 'joined';
                      const canAccess = userTier >= channel.tier;

                      return (
                        <tr
                          key={channel.id}
                          onClick={() => !isLocked && handleJoinChannel(channel)}
                          className={`transition-colors ${
                            isLocked
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-bg-elevated cursor-pointer'
                          }`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{channel.icon}</span>
                              <div>
                                <p className="font-medium text-text-primary">{channel.name}</p>
                                <p className="text-xs text-text-muted line-clamp-1 max-w-[200px]">{channel.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 hidden sm:table-cell">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              canAccess ? 'bg-neon-green/10 text-neon-green' : 'bg-bg-primary text-text-muted'
                            }`}>
                              {TIER_INFO[channel.tier as keyof typeof TIER_INFO]?.icon} {channel.tierName}+
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center hidden md:table-cell">
                            <span className="text-sm text-text-secondary">{channel.memberCount}</span>
                          </td>
                          <td className="px-4 py-4 text-center hidden md:table-cell">
                            <span className="text-sm text-text-secondary">{channel.messageCount}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {joiningChannel?.id === channel.id ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-neon-cyan/10 text-neon-cyan">
                                <LoadingSpinner className="w-3 h-3" /> Joining...
                              </span>
                            ) : isJoined ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-neon-green/10 text-neon-green border border-neon-green/30">
                                <CheckIcon className="w-3 h-3" /> Enter
                              </span>
                            ) : canAccess ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-neon-cyan/10 text-neon-cyan">
                                Join
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-bg-primary text-text-muted">
                                <LockIcon className="w-3 h-3" /> Locked
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {channels.length === 0 && (
                  <div className="text-center py-12">
                    <span className="text-4xl block mb-2">📭</span>
                    <p className="text-text-muted">No channels available</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Claim Badge Tab */}
        {activeTab === 'claim' && (
          <motion.div
            key="claim"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Balance Card */}
            <div className="mb-6 p-4 rounded-xl bg-bg-tertiary border border-border-primary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
                    <span className="text-lg">◎</span>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Your Balance</p>
                    {balanceLoading ? (
                      <p className="text-lg font-bold text-text-muted animate-pulse">Loading...</p>
                    ) : (
                      <p className="text-lg font-bold text-text-primary">{balance.toFixed(4)} SOL</p>
                    )}
                  </div>
                </div>
                {hasBadge && (
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Current Badge</p>
                    <p className="text-lg font-bold text-neon-green">{TIER_INFO[userTier as keyof typeof TIER_INFO]?.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tier Selection Table */}
            <div className="bg-bg-tertiary rounded-xl border border-border-primary overflow-hidden mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Tier</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Price</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">Channels</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary">
                  {[1, 2, 3, 4, 5].map((tier) => {
                    const info = TIER_INFO[tier as keyof typeof TIER_INFO];
                    const price = TIER_PRICES[tier as keyof typeof TIER_PRICES];
                    const canAfford = balance >= price;
                    const alreadyHas = userTier >= tier;
                    const isSelected = selectedTier === tier;

                    return (
                      <tr
                        key={tier}
                        onClick={() => !alreadyHas && canAfford && setSelectedTier(tier)}
                        className={`transition-colors ${
                          alreadyHas
                            ? 'bg-neon-green/5'
                            : isSelected
                            ? 'bg-neon-cyan/10'
                            : canAfford
                            ? 'hover:bg-bg-elevated cursor-pointer'
                            : 'opacity-50'
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center text-xl shadow-lg`}>
                              {info.icon}
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{info.name}</p>
                              <p className="text-xs text-text-muted">Tier {tier}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-lg font-bold text-neon-green">{price} SOL</span>
                        </td>
                        <td className="px-4 py-4 text-center hidden sm:table-cell">
                          <span className="text-sm text-text-secondary">{tier} channel{tier > 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {alreadyHas ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-neon-green/10 text-neon-green">
                              <CheckIcon className="w-3 h-3" /> Owned
                            </span>
                          ) : !canAfford ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs bg-error/10 text-error">
                              Insufficient
                            </span>
                          ) : isSelected ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40">
                              <CheckIcon className="w-3 h-3" /> Selected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs bg-bg-primary text-text-muted hover:bg-bg-elevated">
                              Select
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Claim or Upgrade Button */}
            <div className="flex flex-col items-center gap-4">
              {claimError && (
                <div className="w-full p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm text-center">
                  {claimError}
                </div>
              )}

              {claimSuccess && txSignature && (
                <div className="w-full p-3 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green text-sm text-center">
                  {hasBadge ? 'Badge upgraded' : 'Badge claimed'} successfully!{' '}
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=${network}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    View tx
                  </a>
                </div>
              )}

              {/* Show claim button if no badge OR upgrade button if higher tier selected */}
              {(!hasBadge || selectedTier > userTier) ? (
                <>
                  <button
                    onClick={handleClaimOrUpgrade}
                    disabled={claimLoading || balance < TIER_PRICES[selectedTier as keyof typeof TIER_PRICES]}
                    className={`w-full max-w-md px-6 py-4 rounded-xl font-medium text-lg transition-all ${
                      claimLoading
                        ? 'bg-bg-elevated text-text-muted cursor-wait'
                        : hasBadge
                        ? 'bg-gradient-to-r from-neon-cyan to-blue-500 text-bg-primary hover:shadow-glow-sm'
                        : 'bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary hover:shadow-glow-sm'
                    }`}
                  >
                    {claimLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner className="w-5 h-5" />
                        {hasBadge ? 'Upgrading' : 'Claiming'} {TIER_INFO[selectedTier as keyof typeof TIER_INFO]?.name} Badge...
                      </span>
                    ) : hasBadge ? (
                      <span>
                        Upgrade to {TIER_INFO[selectedTier as keyof typeof TIER_INFO]?.name} for {TIER_PRICES[selectedTier as keyof typeof TIER_PRICES]} SOL
                      </span>
                    ) : (
                      <span>
                        Claim {TIER_INFO[selectedTier as keyof typeof TIER_INFO]?.name} Badge for {TIER_PRICES[selectedTier as keyof typeof TIER_PRICES]} SOL
                      </span>
                    )}
                  </button>

                  <p className="text-xs text-text-muted text-center max-w-md">
                    Privacy-first: Your tier is encrypted with INCO FHE. All 5 proof handles are non-zero,
                    preventing observers from determining your tier.
                  </p>
                </>
              ) : (
                /* Already at max tier or no higher tier selected */
                <div className="text-center py-4 max-w-md mx-auto">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${TIER_INFO[userTier as keyof typeof TIER_INFO]?.color || 'from-gray-500 to-gray-400'} flex items-center justify-center text-3xl shadow-lg`}>
                    {TIER_INFO[userTier as keyof typeof TIER_INFO]?.icon || '🎫'}
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    {userTier >= 5 ? 'Maximum Tier Reached!' : `${TIER_INFO[userTier as keyof typeof TIER_INFO]?.name} Badge Active`}
                  </h3>
                  <p className="text-text-muted text-sm mb-4">
                    {userTier >= 5
                      ? 'You have the Legendary badge - full access to all channels!'
                      : 'Select a higher tier above to upgrade your badge.'
                    }
                  </p>
                  <button
                    onClick={() => setActiveTab('channels')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary font-medium"
                  >
                    Go to Channels
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Channel Modal - INCO FHE Verification Flow */}
      <JoinChannelModal
        isOpen={showJoinModal}
        onClose={handleCloseJoinModal}
        channelName={joiningChannel?.name || ''}
        tierName={joiningChannel ? TIER_INFO[joiningChannel.tier as keyof typeof TIER_INFO]?.name || '' : ''}
        steps={joinSteps.map((step, idx) => ({ ...step, id: `step-${idx}` }))}
        currentStep={joinCurrentStep}
        loading={joinLoading}
        error={joinError}
        success={joinSuccess}
        anonId={joinAnonId}
        txSignature={joinTxSignature}
        onNavigate={handleNavigateToChannel}
      />
    </div>
  );
}

// Icons
const ChannelsIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
  </svg>
);

const BadgeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
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

const LoadingSpinner = ({ className = "w-4 h-4" }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);
