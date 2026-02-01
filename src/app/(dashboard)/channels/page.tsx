'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/privy/hooks';
import { useNetwork } from '@/hooks/useNetwork';
import { useConfidentialBadge, TIER_INFO, TIER_PRICES } from '@/hooks/useConfidentialBadge';
import { useClaimBadge } from '@/hooks/useClaimBadge';
import { useChannelJoin, findAllUserBadges, UserBadge } from '@/hooks/useChannelJoin';
import { useRouter } from 'next/navigation';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { PublicKey, Connection } from '@solana/web3.js';
import {
  deriveConfigPda,
  fetchConfigAccount,
  ConfigAccountData,
} from '@/lib/contract/badge-sdk';
import { JoinChannelModal } from '@/components/modals/JoinChannelModal';
import { TransactionModal, SuccessModal } from '@/components/ui/Modal';
import { BadgeSelectorModal } from '@/components/modals/BadgeSelectorModal';
import NetworkSelectModal from '@/components/ui/NetworkSelectModal';

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
  const { network, rpcPing } = useNetwork();
  const { badge, loading: badgeLoading, refetch: refetchBadge } = useConfidentialBadge();
  const { balance, loading: balanceLoading } = useWalletBalance(walletAddress);
  const {
    claimBadge,
    upgradeTier,
    // closeBadge - available for future use
    loading: claimLoading,
    error: claimError,
    txSignature,
    // success: claimSuccess - handled by txSignature presence
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
  const [networkModalOpen, setNetworkModalOpen] = useState(false);

  // Multi-badge support
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [, setSelectedBadge] = useState<UserBadge | null>(null);
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  const [, setBadgesLoading] = useState(false);

  // Claim/upgrade badge modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showClaimSuccessModal, setShowClaimSuccessModal] = useState(false);
  const [claimSteps, setClaimSteps] = useState<{ label: string; status: 'pending' | 'active' | 'completed' | 'error'; description?: string }[]>([]);
  const [claimCurrentStep, setClaimCurrentStep] = useState(0);

  // Auto-switch to claim tab if no badge
  useEffect(() => {
    if (!badgeLoading && !badge?.hasClaimed && !onChainBadge?.isActive) {
      setActiveTab('claim');
    }
  }, [badge, badgeLoading, onChainBadge]);

  // Sync on-chain badge to MongoDB if missing
  const syncBadgeToMongo = useCallback(async (badgePda: string, tier: number, proofs: Record<string, string>) => {
    if (!walletAddress) return;

    try {
      const checkRes = await fetch(`/api/badges/confidential?wallet=${walletAddress}`);
      const checkData = await checkRes.json();

      if (checkData.success && checkData.badge?.hasClaimed) {
        await refetchBadge();
        return;
      }

      await fetch('/api/badges/confidential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          txSignature: 'synced-from-chain',
          tier,
          tierName: TIER_INFO[tier as keyof typeof TIER_INFO]?.name || 'Unknown',
          badgeAccountAddress: badgePda,
          amountPaid: 0,
          proofHandles: proofs,
        }),
      });

      await refetchBadge();
    } catch (err) {
      console.error('Failed to sync badge to MongoDB:', err);
    }
  }, [walletAddress, refetchBadge]);

  // Fetch on-chain badge data
  const fetchOnChainData = useCallback(async () => {
    if (!walletAddress) return;

    setBadgesLoading(true);

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_DEVNET_RPC || 'https://api.devnet.solana.com',
        'confirmed'
      );

      const userPubkey = new PublicKey(walletAddress);
      const [configPda] = deriveConfigPda();

      const [configData, badges] = await Promise.all([
        fetchConfigAccount(connection, configPda),
        findAllUserBadges(connection, userPubkey),
      ]);

      if (configData) setConfig(configData);
      setUserBadges(badges);

      if (badges.length > 0) {
        let primaryBadge = badges[0];

        if (badge?.badgeAccountAddress) {
          const matchingBadge = badges.find(b => b.pda.toBase58() === badge.badgeAccountAddress);
          if (matchingBadge) primaryBadge = matchingBadge;
        }

        setSelectedBadge(primaryBadge);

        const tierNum = badge?.tier || 1;
        const onChainData = {
          pda: primaryBadge.pda.toBase58(),
          badgeId: primaryBadge.badgeId,
          tier: tierNum,
          tierName: TIER_INFO[tierNum as keyof typeof TIER_INFO]?.name || 'Unknown',
          owner: primaryBadge.data.owner.toBase58(),
          isActive: primaryBadge.data.isActive,
          proofs: {
            bronze: primaryBadge.data.proofBronze,
            silver: primaryBadge.data.proofSilver,
            gold: primaryBadge.data.proofGold,
            diamond: primaryBadge.data.proofDiamond,
            legendary: primaryBadge.data.proofLegendary,
          },
        };

        setOnChainBadge(onChainData);

        if (!badge?.hasClaimed) {
          await syncBadgeToMongo(onChainData.pda, tierNum, onChainData.proofs);
        }
      } else {
        setOnChainBadge(null);
        setSelectedBadge(null);
        setUserBadges([]);
      }
    } catch (error) {
      console.error('Failed to fetch on-chain data:', error);
      setOnChainBadge(null);
      setSelectedBadge(null);
      setUserBadges([]);
    } finally {
      setBadgesLoading(false);
    }
  }, [walletAddress, badge?.tier, badge?.hasClaimed, badge?.badgeAccountAddress, syncBadgeToMongo]);

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

    const isUpgrade = hasBadge && selectedTier > userTier;

    const steps = [
      { label: 'Prepare Transaction', status: 'pending' as const, description: 'Building badge transaction...' },
      { label: 'Encrypt Tier Data (INCO FHE)', status: 'pending' as const, description: 'Creating encrypted tier proofs...' },
      { label: 'Sign Transaction', status: 'pending' as const, description: 'Waiting for wallet signature...' },
      { label: 'Confirm On-Chain', status: 'pending' as const, description: 'Waiting for blockchain confirmation...' },
      { label: 'Save to Database', status: 'pending' as const, description: 'Syncing badge data...' },
    ];

    setClaimSteps(steps);
    setClaimCurrentStep(0);
    setShowClaimModal(true);

    const updateStep = (index: number, status: 'active' | 'completed' | 'error', description?: string) => {
      setClaimSteps(prev => prev.map((s, i) =>
        i === index ? { ...s, status, description: description || s.description } : s
      ));
      if (status === 'active') setClaimCurrentStep(index);
    };

    try {
      updateStep(0, 'active');
      await new Promise(r => setTimeout(r, 500));
      updateStep(0, 'completed');

      updateStep(1, 'active');
      await new Promise(r => setTimeout(r, 300));

      updateStep(1, 'completed');
      updateStep(2, 'active', 'Please approve in your wallet...');

      let result;
      if (isUpgrade) {
        const badgeId = onChainBadge?.badgeId ?? BigInt(0);
        result = await upgradeTier(selectedTier, userTier, badgeId);
      } else {
        result = await claimBadge(selectedTier);
      }

      if (!result.success) {
        throw new Error(result.error || 'Transaction failed');
      }

      updateStep(2, 'completed');
      updateStep(3, 'active', 'Transaction submitted, waiting for confirmation...');
      await new Promise(r => setTimeout(r, 1000));
      updateStep(3, 'completed');

      updateStep(4, 'active');
      await new Promise(r => setTimeout(r, 500));
      updateStep(4, 'completed');

      setShowClaimModal(false);
      setShowClaimSuccessModal(true);

      await refetchBadge();
      await fetchOnChainData();
      await fetchChannels();
      setActiveTab('channels');
    } catch (error) {
      console.error('Claim/upgrade error:', error);
      setClaimSteps(prev => prev.map((s, i) =>
        i === claimCurrentStep ? { ...s, status: 'error' as const, description: error instanceof Error ? error.message : 'Transaction failed' } : s
      ));
      setTimeout(() => setShowClaimModal(false), 2500);
    }
  };

  // Handle join channel
  const handleJoinChannel = async (channel: Channel) => {
    if (!walletAddress) return;

    // Diamond and Legendary coming soon
    if (channel.tier >= 4) return;

    if (channel.userAccess === 'joined') {
      router.push(`/channels/${channel.slug}`);
      return;
    }

    if (channel.userAccess === 'locked') return;

    if (userBadges.length > 1) {
      setJoiningChannel(channel);
      setShowBadgeSelector(true);
      return;
    }

    if (userBadges.length === 1) {
      await startJoinFlow(channel, userBadges[0]);
      return;
    }

    console.error('[Channels] No badges available for joining');
  };

  const startJoinFlow = async (channel: Channel, badgeToUse: UserBadge) => {
    setJoiningChannel(channel);
    setSelectedBadge(badgeToUse);
    setShowBadgeSelector(false);
    setShowJoinModal(true);
    resetJoin();

    const result = await joinChannel(channel.slug, channel.tier, badgeToUse);

    if (result.success) {
      await fetchChannels();
    }
  };

  const handleBadgeSelect = (badge: UserBadge) => {
    if (joiningChannel) {
      startJoinFlow(joiningChannel, badge);
    }
  };

  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
    setJoiningChannel(null);
    resetJoin();
  };

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
        <div className="text-center px-4">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-lg font-bold text-text-primary mb-1">Connect Wallet</h2>
          <p className="text-text-muted text-sm">Connect your wallet to access channels</p>
        </div>
      </div>
    );
  }

  const userTier = badge?.tier || onChainBadge?.tier || 0;
  const hasBadge = badge?.hasClaimed || onChainBadge?.isActive;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Hero Banner */}
      <div className="relative mb-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-bg-tertiary via-bg-secondary to-bg-tertiary border border-border-primary overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,255,136,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,212,255,0.06),transparent_50%)]" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">🐋</span>
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Whale Channels</h1>
              </div>
              <p className="text-text-muted text-sm max-w-md">
                Private tier-gated messaging powered by <span className="text-neon-cyan font-medium">INCO FHE</span>.
                Your tier is encrypted on-chain - zero knowledge required.
              </p>
            </div>

            {/* Network Toggle - Same as Header */}
            <div className="flex items-center gap-3">
              <NetworkToggle
                network={network}
                ping={rpcPing}
                onClick={() => setNetworkModalOpen(true)}
              />
              {config && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-primary/50 border border-border-secondary">
                  <span className="text-neon-green font-bold text-sm">{config.totalBadges}</span>
                  <span className="text-text-muted text-xs">badges</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Devnet Notice Banner */}
      {network === 'devnet' && (
        <div className="mb-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-warning/10 via-warning/5 to-transparent border border-warning/30">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-warning text-sm">Devnet Mode</p>
                <p className="text-text-muted text-xs">Using Solana Devnet for testing</p>
              </div>
            </div>
            <div className="sm:ml-auto flex flex-wrap gap-2">
              <a
                href="https://faucet.solana.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-warning/20 text-warning text-xs font-medium hover:bg-warning/30 transition-colors"
              >
                Get Devnet SOL →
              </a>
              <button
                onClick={() => setNetworkModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-xs font-medium hover:bg-bg-elevated transition-colors"
              >
                Switch Network
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            💡 <span className="font-medium">Tip:</span> Enable testnet mode in your wallet (Phantom → Settings → Developer Settings → Testnet Mode)
          </p>
        </div>
      )}

      {/* Early Adopter Banner */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-neon-green/10 via-neon-cyan/5 to-neon-green/10 border border-neon-green/30">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center text-lg">
              🎁
            </div>
            <div>
              <p className="font-semibold text-neon-green text-sm">Early Adopter Benefits</p>
              <p className="text-text-muted text-xs">Claim your badge now and get exclusive access!</p>
            </div>
          </div>
          <div className="sm:ml-auto">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-neon-green/20 text-neon-green">✓ Discounted prices</span>
              <span className="px-2 py-1 rounded bg-neon-cyan/20 text-neon-cyan">✓ Pioneer badge</span>
              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400">✓ Mainnet airdrop</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badge Status Bar */}
      {hasBadge && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-bg-tertiary to-bg-secondary border border-neon-green/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${TIER_INFO[userTier as keyof typeof TIER_INFO]?.color || 'from-gray-500 to-gray-400'} flex items-center justify-center text-2xl shadow-lg`}>
                {TIER_INFO[userTier as keyof typeof TIER_INFO]?.icon || '🎫'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-text-primary">{TIER_INFO[userTier as keyof typeof TIER_INFO]?.name} Whale</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-neon-green/10 text-neon-green border border-neon-green/30">VERIFIED</span>
                </div>
                <p className="text-xs text-text-muted">
                  Access to {Math.min(userTier, 3)} channel{userTier > 1 ? 's' : ''} • Encrypted proofs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((t) => {
                const hasAccess = userTier >= t;
                const info = TIER_INFO[t as keyof typeof TIER_INFO];
                const isComingSoon = t >= 4;
                return (
                  <div
                    key={t}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm relative ${
                      isComingSoon ? 'bg-bg-primary/50 opacity-40' : hasAccess ? 'bg-neon-green/20 border border-neon-green/40' : 'bg-bg-primary/50 opacity-40'
                    }`}
                    title={`${info.name}: ${isComingSoon ? 'Coming Soon' : hasAccess ? 'Unlocked' : 'Locked'}`}
                  >
                    {info.icon}
                    {isComingSoon && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full flex items-center justify-center text-[8px]">⏳</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-border-primary overflow-x-auto">
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'channels'
              ? 'border-neon-green text-neon-green'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <span className="flex items-center gap-2">
            <ChannelsIcon className="w-4 h-4" />
            Channels
            {hasBadge && <span className="px-1.5 py-0.5 rounded text-[10px] bg-neon-green/10">{channels.filter(c => c.tier <= 3).length}</span>}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('claim')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
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
              <div className="space-y-4">
                {/* Available Channels */}
                <div className="bg-bg-tertiary rounded-xl border border-border-primary overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-secondary bg-bg-secondary/50">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <span className="text-neon-green">●</span> Available Channels
                    </h3>
                  </div>

                  {/* Mobile Card View */}
                  <div className="sm:hidden divide-y divide-border-secondary">
                    {channels.filter(c => c.tier <= 3).map((channel) => {
                      const isLocked = channel.userAccess === 'locked' && userTier < channel.tier;
                      const isJoined = channel.userAccess === 'joined';
                      const canAccess = userTier >= channel.tier;

                      return (
                        <div
                          key={channel.id}
                          onClick={() => !isLocked && handleJoinChannel(channel)}
                          className={`p-4 transition-colors ${
                            isLocked ? 'opacity-50' : 'active:bg-bg-elevated'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{channel.icon}</span>
                              <div>
                                <p className="font-medium text-text-primary">{channel.name}</p>
                                <p className="text-xs text-text-muted">{TIER_INFO[channel.tier as keyof typeof TIER_INFO]?.name}+ • {channel.memberCount} members</p>
                              </div>
                            </div>
                            {isJoined ? (
                              <span className="px-3 py-1.5 rounded-lg text-xs bg-neon-green/10 text-neon-green border border-neon-green/30">Enter</span>
                            ) : canAccess ? (
                              <span className="px-3 py-1.5 rounded-lg text-xs bg-neon-cyan/10 text-neon-cyan">Join</span>
                            ) : (
                              <span className="px-3 py-1.5 rounded-lg text-xs bg-bg-primary text-text-muted">
                                <LockIcon className="w-3 h-3 inline mr-1" />Locked
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <table className="w-full hidden sm:table">
                    <thead>
                      <tr className="border-b border-border-secondary">
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Channel</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Tier</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Members</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Messages</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                      {channels.filter(c => c.tier <= 3).map((channel) => {
                        const isLocked = channel.userAccess === 'locked' && userTier < channel.tier;
                        const isJoined = channel.userAccess === 'joined';
                        const canAccess = userTier >= channel.tier;

                        return (
                          <tr
                            key={channel.id}
                            onClick={() => !isLocked && handleJoinChannel(channel)}
                            className={`transition-colors ${
                              isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg-elevated cursor-pointer'
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
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                canAccess ? 'bg-neon-green/10 text-neon-green' : 'bg-bg-primary text-text-muted'
                              }`}>
                                {TIER_INFO[channel.tier as keyof typeof TIER_INFO]?.icon} {channel.tierName}+
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-sm text-text-secondary">{channel.memberCount}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
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
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-neon-cyan/10 text-neon-cyan">Join</span>
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
                </div>

                {/* Coming Soon Channels */}
                <div className="bg-bg-tertiary/50 rounded-xl border border-border-secondary overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-secondary bg-gradient-to-r from-purple-500/10 to-transparent">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <span className="text-warning">⏳</span> Coming Soon on Mainnet
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-400">Premium</span>
                    </h3>
                  </div>

                  <div className="divide-y divide-border-secondary">
                    {channels.filter(c => c.tier >= 4).map((channel) => (
                      <div key={channel.id} className="p-4 opacity-60">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl grayscale">{channel.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-text-primary">{channel.name}</p>
                                <span className="px-2 py-0.5 rounded text-[10px] bg-warning/20 text-warning">Mainnet Only</span>
                              </div>
                              <p className="text-xs text-text-muted">{channel.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-bg-primary text-text-muted">
                              <LockIcon className="w-3 h-3" /> Coming Soon
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-500/5 to-transparent border-t border-border-secondary">
                    <p className="text-xs text-text-muted text-center">
                      💎 Diamond and 👑 Legendary channels will be available on Mainnet launch.
                      <span className="text-purple-400 font-medium"> Early adopters get priority access!</span>
                    </p>
                  </div>
                </div>
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

            {/* Tier Selection */}
            <div className="bg-bg-tertiary rounded-xl border border-border-primary overflow-hidden mb-6">
              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-border-secondary">
                {[1, 2, 3].map((tier) => {
                  const info = TIER_INFO[tier as keyof typeof TIER_INFO];
                  const price = TIER_PRICES[tier as keyof typeof TIER_PRICES];
                  const canAfford = balance >= price;
                  const alreadyHas = userTier >= tier;
                  const isSelected = selectedTier === tier;

                  return (
                    <div
                      key={tier}
                      onClick={() => !alreadyHas && canAfford && setSelectedTier(tier)}
                      className={`p-4 transition-colors ${
                        alreadyHas ? 'bg-neon-green/5' : isSelected ? 'bg-neon-cyan/10' : canAfford ? 'active:bg-bg-elevated' : 'opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center text-xl shadow-lg`}>
                            {info.icon}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{info.name}</p>
                            <p className="text-lg font-bold text-neon-green">{price} SOL</p>
                          </div>
                        </div>
                        {alreadyHas ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs bg-neon-green/10 text-neon-green">Owned</span>
                        ) : !canAfford ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs bg-error/10 text-error">Insufficient</span>
                        ) : isSelected ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40">Selected</span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg text-xs bg-bg-primary text-text-muted">Select</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <table className="w-full hidden sm:table">
                <thead>
                  <tr className="border-b border-border-secondary">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Tier</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Price</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Channels</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary">
                  {[1, 2, 3].map((tier) => {
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
                          alreadyHas ? 'bg-neon-green/5' : isSelected ? 'bg-neon-cyan/10' : canAfford ? 'hover:bg-bg-elevated cursor-pointer' : 'opacity-50'
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
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm text-text-secondary">{tier} channel{tier > 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {alreadyHas ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-neon-green/10 text-neon-green">
                              <CheckIcon className="w-3 h-3" /> Owned
                            </span>
                          ) : !canAfford ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs bg-error/10 text-error">Insufficient</span>
                          ) : isSelected ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40">
                              <CheckIcon className="w-3 h-3" /> Selected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs bg-bg-primary text-text-muted hover:bg-bg-elevated">Select</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Coming Soon Tiers */}
              <div className="border-t border-border-secondary bg-gradient-to-r from-purple-500/5 to-transparent">
                <div className="px-4 py-2 text-xs text-text-muted">
                  <span className="text-warning">⏳</span> Diamond & Legendary tiers coming on Mainnet
                </div>
              </div>
            </div>

            {/* Claim Button */}
            <div className="flex flex-col items-center gap-4">
              {claimError && (
                <div className="w-full p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm text-center">
                  {claimError}
                </div>
              )}

              {(!hasBadge || selectedTier > userTier) && selectedTier <= 3 ? (
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
                        {hasBadge ? 'Upgrading' : 'Claiming'}...
                      </span>
                    ) : hasBadge ? (
                      <span>Upgrade to {TIER_INFO[selectedTier as keyof typeof TIER_INFO]?.name} for {TIER_PRICES[selectedTier as keyof typeof TIER_PRICES]} SOL</span>
                    ) : (
                      <span>Claim {TIER_INFO[selectedTier as keyof typeof TIER_INFO]?.name} Badge for {TIER_PRICES[selectedTier as keyof typeof TIER_PRICES]} SOL</span>
                    )}
                  </button>

                  <p className="text-xs text-text-muted text-center max-w-md px-4">
                    🔐 Privacy-first: Your tier is encrypted with INCO FHE. All 5 proof handles are non-zero - zero knowledge guaranteed.
                  </p>
                </>
              ) : (
                <div className="text-center py-4 max-w-md mx-auto">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${TIER_INFO[userTier as keyof typeof TIER_INFO]?.color || 'from-gray-500 to-gray-400'} flex items-center justify-center text-3xl shadow-lg`}>
                    {TIER_INFO[userTier as keyof typeof TIER_INFO]?.icon || '🎫'}
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    {userTier >= 3 ? 'Gold Badge Active!' : `${TIER_INFO[userTier as keyof typeof TIER_INFO]?.name} Badge Active`}
                  </h3>
                  <p className="text-text-muted text-sm mb-4">
                    {userTier >= 3
                      ? 'You have the highest tier available on Devnet. Diamond & Legendary coming on Mainnet!'
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

      {/* Modals */}
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

      <TransactionModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        title={hasBadge ? `Upgrading to ${TIER_INFO[selectedTier as keyof typeof TIER_INFO]?.name}` : `Claiming ${TIER_INFO[selectedTier as keyof typeof TIER_INFO]?.name} Badge`}
        steps={claimSteps}
        currentStep={claimCurrentStep}
        error={claimError || undefined}
      />

      <SuccessModal
        isOpen={showClaimSuccessModal}
        onClose={() => {
          setShowClaimSuccessModal(false);
          setActiveTab('channels');
        }}
        title={hasBadge ? 'Badge Upgraded!' : 'Badge Claimed!'}
        message={`You now have access to ${TIER_INFO[selectedTier as keyof typeof TIER_INFO]?.name} tier channels.`}
        txSignature={txSignature || undefined}
        actions={
          <button
            onClick={() => {
              setShowClaimSuccessModal(false);
              setActiveTab('channels');
            }}
            className="w-full py-2 px-4 bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary text-sm font-semibold rounded-lg hover:shadow-glow-sm transition-all"
          >
            View Channels
          </button>
        }
      />

      <BadgeSelectorModal
        isOpen={showBadgeSelector}
        onClose={() => {
          setShowBadgeSelector(false);
          setJoiningChannel(null);
        }}
        badges={userBadges}
        channelName={joiningChannel?.name || ''}
        requiredTier={joiningChannel?.tier || 1}
        onSelect={handleBadgeSelect}
      />

      <NetworkSelectModal
        isOpen={networkModalOpen}
        onClose={() => setNetworkModalOpen(false)}
      />
    </div>
  );
}

// Network Toggle Component (same as Header)
function NetworkToggle({
  network,
  ping,
  onClick
}: {
  network: 'mainnet' | 'devnet';
  ping: number | null;
  onClick: () => void;
}) {
  const pingStatus = ping === null
    ? 'loading'
    : ping < 0
    ? 'error'
    : ping < 200
    ? 'excellent'
    : ping < 500
    ? 'good'
    : 'slow';

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] ${
        network === 'mainnet'
          ? 'bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/15 hover:border-neon-green/50'
          : 'bg-warning/10 text-warning border border-warning/30 hover:bg-warning/15 hover:border-warning/50'
      }`}
    >
      <span className={`w-2 h-2 rounded-full transition-all ${
        network === 'mainnet' ? 'bg-neon-green' : 'bg-warning'
      } ${ping !== null && ping >= 0 ? 'animate-pulse' : ''}`} />

      <span className="font-semibold">
        {network === 'mainnet' ? 'Mainnet' : 'Devnet'}
      </span>

      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
        pingStatus === 'loading'
          ? 'bg-bg-tertiary text-text-muted'
          : pingStatus === 'error'
          ? 'bg-error/20 text-error'
          : pingStatus === 'excellent'
          ? 'bg-neon-green/20 text-neon-green'
          : pingStatus === 'good'
          ? 'bg-warning/20 text-warning'
          : 'bg-error/20 text-error'
      }`}>
        <SignalIcon className="w-2.5 h-2.5" />
        {pingStatus === 'loading' ? '...' : pingStatus === 'error' ? 'err' : `${ping}ms`}
      </span>

      <ChevronUpDownIcon className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
    </button>
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

const SignalIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546" />
  </svg>
);

const ChevronUpDownIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
  </svg>
);
