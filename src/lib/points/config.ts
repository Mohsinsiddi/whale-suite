/**
 * Whale Suite - Points & Privacy Score System
 *
 * This module defines the complete points system configuration.
 * It's designed to be easily extensible for new SDK integrations.
 *
 * STEALTH RATING (Privacy Score): 0-1000
 * - Measures how "invisible" a user is on-chain
 * - Based on privacy-focused activities
 * - Higher = more anonymous trading behavior
 *
 * POINTS SYSTEM:
 * - Rewards users for platform engagement
 * - Multiplied by badge tier
 * - Used for leaderboard rankings
 */

// ============================================================
// POINT ACTIONS - All activities that earn points
// ============================================================

export const POINT_ACTIONS = {
  // ─────────────────────────────────────────────────────────
  // PRIVACY CASH (privacycash SDK)
  // Shield your SOL balance with zero-knowledge proofs
  // ─────────────────────────────────────────────────────────
  privacy_deposit: {
    basePoints: 15,
    category: 'privacy-cash',
    sdk: 'privacycash',
    description: 'Deposit SOL into Privacy Cash vault',
    privacyWeight: 3, // High privacy impact
    volumeMultiplier: true, // Points scale with amount
    cooldown: 0, // No cooldown
  },
  privacy_withdraw: {
    basePoints: 8,
    category: 'privacy-cash',
    sdk: 'privacycash',
    description: 'Withdraw SOL from Privacy Cash vault',
    privacyWeight: 1,
    volumeMultiplier: true,
    cooldown: 0,
  },

  // ─────────────────────────────────────────────────────────
  // SHADOWWIRE (radr/shadowwire SDK)
  // Private transfers with hidden amounts using Bulletproofs
  // ─────────────────────────────────────────────────────────
  shadow_transfer: {
    basePoints: 25,
    category: 'shadow-wire',
    sdk: 'shadowwire',
    description: 'Send private transfer with hidden amount',
    privacyWeight: 5, // Highest privacy impact
    volumeMultiplier: false,
    cooldown: 0,
  },
  standard_transfer: {
    basePoints: 5,
    category: 'shadow-wire',
    sdk: 'shadowwire',
    description: 'Send standard transfer via ShadowWire',
    privacyWeight: 1,
    volumeMultiplier: false,
    cooldown: 0,
  },
  multi_send: {
    basePoints: 30,
    category: 'shadow-wire',
    sdk: 'shadowwire',
    description: 'Send to multiple recipients at once',
    privacyWeight: 4,
    volumeMultiplier: false, // Bonus per recipient instead
    cooldown: 0,
  },

  // ─────────────────────────────────────────────────────────
  // DARKLAKE (darklake SDK)
  // Private swaps with ZK proofs - hidden trade amounts
  // ─────────────────────────────────────────────────────────
  darklake_swap: {
    basePoints: 35,
    category: 'darklake',
    sdk: 'darklake',
    description: 'Execute private swap with hidden amounts',
    privacyWeight: 5, // Maximum privacy
    volumeMultiplier: true,
    cooldown: 0,
  },
  darklake_provide_liquidity: {
    basePoints: 50,
    category: 'darklake',
    sdk: 'darklake',
    description: 'Provide liquidity to dark pool',
    privacyWeight: 3,
    volumeMultiplier: true,
    cooldown: 0,
  },

  // ─────────────────────────────────────────────────────────
  // JUPITER (jupiter SDK)
  // Best swap rates - PUBLIC transactions
  // ─────────────────────────────────────────────────────────
  jupiter_swap: {
    basePoints: 5,
    category: 'jupiter',
    sdk: 'jupiter',
    description: 'Swap tokens via Jupiter aggregator',
    privacyWeight: 0, // Public swap, no privacy benefit
    volumeMultiplier: true, // 1 point per $100 volume
    cooldown: 0,
  },

  // ─────────────────────────────────────────────────────────
  // PNP EXCHANGE (pnp-sdk)
  // Anonymous prediction markets
  // ─────────────────────────────────────────────────────────
  pnp_bet: {
    basePoints: 20,
    category: 'pnp',
    sdk: 'pnp',
    description: 'Place anonymous prediction bet',
    privacyWeight: 3,
    volumeMultiplier: true,
    cooldown: 0,
  },
  pnp_create_market: {
    basePoints: 100,
    category: 'pnp',
    sdk: 'pnp',
    description: 'Create a new prediction market',
    privacyWeight: 2,
    volumeMultiplier: false,
    cooldown: 86400000, // 24 hours
  },
  pnp_claim_winnings: {
    basePoints: 10,
    category: 'pnp',
    sdk: 'pnp',
    description: 'Claim winnings from prediction',
    privacyWeight: 1,
    volumeMultiplier: true,
    cooldown: 0,
  },

  // ─────────────────────────────────────────────────────────
  // ANONCOIN (Token Launcher)
  // Gasless anonymous token creation
  // ─────────────────────────────────────────────────────────
  token_launch: {
    basePoints: 200,
    category: 'anoncoin',
    sdk: 'anoncoin',
    description: 'Launch anonymous token on Solana',
    privacyWeight: 4,
    volumeMultiplier: false,
    cooldown: 3600000, // 1 hour
  },

  // ─────────────────────────────────────────────────────────
  // STARPAY (Virtual Cards)
  // Anonymous crypto spending
  // ─────────────────────────────────────────────────────────
  card_order: {
    basePoints: 75,
    category: 'starpay',
    sdk: 'starpay',
    description: 'Order anonymous virtual card',
    privacyWeight: 4,
    volumeMultiplier: false,
    cooldown: 0,
  },
  card_topup: {
    basePoints: 15,
    category: 'starpay',
    sdk: 'starpay',
    description: 'Top up virtual card balance',
    privacyWeight: 2,
    volumeMultiplier: true,
    cooldown: 0,
  },

  // ─────────────────────────────────────────────────────────
  // INCO CHANNELS (Confidential Computing)
  // Encrypted tier verification for exclusive channels
  // ─────────────────────────────────────────────────────────
  channel_join: {
    basePoints: 20,
    category: 'inco-channels',
    sdk: 'inco',
    description: 'Join an exclusive tier-based channel',
    privacyWeight: 5, // Maximum privacy - encrypted verification
    volumeMultiplier: false,
    cooldown: 0,
  },
  channel_participate: {
    basePoints: 5,
    category: 'inco-channels',
    sdk: 'inco',
    description: 'Participate in channel discussions',
    privacyWeight: 3,
    volumeMultiplier: false,
    cooldown: 3600000, // 1 hour
  },

  // ─────────────────────────────────────────────────────────
  // ENGAGEMENT & SOCIAL
  // Platform engagement rewards
  // ─────────────────────────────────────────────────────────
  daily_login: {
    basePoints: 10,
    category: 'engagement',
    sdk: null,
    description: 'Daily platform login',
    privacyWeight: 0,
    volumeMultiplier: false,
    cooldown: 86400000, // 24 hours
  },
  referral: {
    basePoints: 100,
    category: 'social',
    sdk: null,
    description: 'Refer a new user who registers',
    privacyWeight: 0,
    volumeMultiplier: false,
    cooldown: 0,
  },
  referral_purchase: {
    basePoints: 250,
    category: 'social',
    sdk: null,
    description: 'Referred user makes a purchase',
    privacyWeight: 0,
    volumeMultiplier: false,
    cooldown: 0,
  },

  // ─────────────────────────────────────────────────────────
  // BADGES (One-time purchases)
  // Premium membership NFTs
  // ─────────────────────────────────────────────────────────
  badge_bronze: {
    basePoints: 500,
    category: 'badge',
    sdk: null,
    description: 'Purchase Bronze badge',
    privacyWeight: 0,
    volumeMultiplier: false,
    cooldown: 0,
  },
  badge_silver: {
    basePoints: 1000,
    category: 'badge',
    sdk: null,
    description: 'Purchase Silver badge',
    privacyWeight: 0,
    volumeMultiplier: false,
    cooldown: 0,
  },
  badge_gold: {
    basePoints: 2000,
    category: 'badge',
    sdk: null,
    description: 'Purchase Gold badge',
    privacyWeight: 0,
    volumeMultiplier: false,
    cooldown: 0,
  },
  badge_diamond: {
    basePoints: 3500,
    category: 'badge',
    sdk: null,
    description: 'Purchase Diamond badge',
    privacyWeight: 0,
    volumeMultiplier: false,
    cooldown: 0,
  },
  badge_legendary: {
    basePoints: 5000,
    category: 'badge',
    sdk: null,
    description: 'Purchase Legendary badge',
    privacyWeight: 0,
    volumeMultiplier: false,
    cooldown: 0,
  },
} as const;

export type PointAction = keyof typeof POINT_ACTIONS;

// ============================================================
// BADGE TIERS - Multipliers for point earnings
// ============================================================

export const BADGE_TIERS = {
  none: {
    multiplier: 1.0,
    name: 'Free',
    color: '#6a7f8a',
    icon: '🆓',
    privacyBonus: 0,
    affiliateRate: 0,
    description: 'Basic access to privacy tools',
  },
  bronze: {
    multiplier: 1.25,
    name: 'Bronze Ghost',
    color: '#CD7F32',
    icon: '🥉',
    privacyBonus: 20,
    affiliateRate: 0.05,
    price: 0.5, // SOL
    description: '25% point boost, 5% affiliate commission',
  },
  silver: {
    multiplier: 1.5,
    name: 'Silver Shadow',
    color: '#C0C0C0',
    icon: '🥈',
    privacyBonus: 40,
    affiliateRate: 0.10,
    price: 2,
    description: '50% point boost, 10% affiliate commission',
  },
  gold: {
    multiplier: 1.75,
    name: 'Gold Phantom',
    color: '#FFD700',
    icon: '🥇',
    privacyBonus: 60,
    affiliateRate: 0.15,
    price: 5,
    description: '75% point boost, 15% affiliate commission',
  },
  diamond: {
    multiplier: 2.0,
    name: 'Diamond Whale',
    color: '#B9F2FF',
    icon: '💎',
    privacyBonus: 80,
    affiliateRate: 0.20,
    price: 10,
    description: '2x point multiplier, 20% affiliate commission',
  },
  legendary: {
    multiplier: 2.5,
    name: 'Legendary Titan',
    color: '#FF00FF',
    icon: '👑',
    privacyBonus: 100,
    affiliateRate: 0.25,
    price: 25,
    description: '2.5x points, 25% affiliate, 1% revenue share',
  },
} as const;

export type BadgeTier = keyof typeof BADGE_TIERS;

// ============================================================
// PRIVACY SCORE (STEALTH RATING) CONFIGURATION
// ============================================================

export const PRIVACY_SCORE_CONFIG = {
  maxScore: 1000,

  // How different stats contribute to privacy score
  weights: {
    // Hidden balance: 1 point per 0.1 SOL hidden (max 300)
    hiddenBalance: {
      pointsPer: 0.1, // SOL
      pointsEach: 1,
      max: 300,
      description: 'SOL hidden in Privacy Cash vault',
    },

    // Private transfers: 5 points each (max 250)
    privateTransfers: {
      pointsEach: 5,
      max: 250,
      description: 'Private transfers sent via ShadowWire or Darklake',
    },

    // Anonymous bets: 3 points each (max 150)
    anonymousBets: {
      pointsEach: 3,
      max: 150,
      description: 'Anonymous predictions on PNP Exchange',
    },

    // Swap volume: 1 point per 10 SOL (max 100)
    swapVolume: {
      pointsPer: 10, // SOL
      pointsEach: 1,
      max: 100,
      description: 'Total volume swapped (private swaps weighted higher)',
    },

    // Streak: 10 points per day (max 100)
    streak: {
      pointsEach: 10,
      max: 100,
      description: 'Consecutive days active on platform',
    },

    // Badge bonus (max 100)
    badge: {
      max: 100,
      description: 'Bonus from badge tier ownership',
    },
  },
};

// ============================================================
// SDK REGISTRY - For extensibility
// ============================================================

export const SDK_REGISTRY = {
  privacycash: {
    name: 'Privacy Cash',
    description: 'Hide your SOL balance with ZK proofs',
    website: 'https://privacycash.io',
    bounty: '$2,500',
    features: ['deposit', 'withdraw', 'balance'],
    privacyLevel: 'high',
  },
  shadowwire: {
    name: 'ShadowWire',
    description: 'Private transfers with Bulletproofs',
    website: 'https://radr.dev',
    bounty: 'Yes',
    features: ['transfer', 'multi-send', 'stealth-address'],
    privacyLevel: 'high',
  },
  darklake: {
    name: 'Darklake',
    description: 'ZK-powered private swaps',
    website: 'https://darklake.fi',
    bounty: 'Yes',
    features: ['swap', 'liquidity', 'dark-pool'],
    privacyLevel: 'maximum',
  },
  jupiter: {
    name: 'Jupiter',
    description: 'Best swap rates aggregator',
    website: 'https://jup.ag',
    bounty: 'Ecosystem',
    features: ['swap', 'limit-order', 'dca'],
    privacyLevel: 'none', // Public transactions
  },
  pnp: {
    name: 'PNP Exchange',
    description: 'Anonymous prediction markets',
    website: 'https://pnp.exchange',
    bounty: 'Yes',
    features: ['bet', 'create-market', 'claim'],
    privacyLevel: 'medium',
  },
  anoncoin: {
    name: 'Anoncoin',
    description: 'Gasless anonymous token launch',
    website: 'https://anoncoin.it',
    bounty: '$10,000',
    features: ['launch-token'],
    privacyLevel: 'high',
  },
  starpay: {
    name: 'Starpay',
    description: 'Anonymous virtual cards',
    website: 'https://starpay.finance',
    bounty: '$3,500',
    features: ['order-card', 'topup'],
    privacyLevel: 'high',
  },
  helius: {
    name: 'Helius',
    description: 'RPC & whale intelligence',
    website: 'https://helius.dev',
    bounty: 'Sponsor',
    features: ['rpc', 'webhooks', 'tracking'],
    privacyLevel: 'infrastructure',
  },
  inco: {
    name: 'INCO Network',
    description: 'Fully Homomorphic Encryption for confidential computing',
    website: 'https://inco.org',
    bounty: 'Sponsor',
    features: ['fhe', 'encrypted-verification', 'confidential-channels'],
    privacyLevel: 'maximum',
  },
  lightprotocol: {
    name: 'Light Protocol',
    description: 'ZK state compression',
    website: 'https://lightprotocol.com',
    bounty: 'Main Sponsor',
    features: ['compression', 'zk-proofs'],
    privacyLevel: 'infrastructure',
  },
} as const;

export type SdkId = keyof typeof SDK_REGISTRY;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Calculate points for an action with badge multiplier
 */
export function calculatePoints(
  action: PointAction,
  badgeTier: BadgeTier,
  volumeMultiplier: number = 1
): {
  basePoints: number;
  multiplier: number;
  totalPoints: number;
  privacyImpact: number;
} {
  const actionConfig = POINT_ACTIONS[action];
  const tierConfig = BADGE_TIERS[badgeTier];

  let basePoints: number = actionConfig.basePoints;
  if (actionConfig.volumeMultiplier) {
    basePoints = Math.floor(basePoints * volumeMultiplier);
  }

  const multiplier: number = tierConfig.multiplier;
  const totalPoints = Math.floor(basePoints * multiplier);
  const privacyImpact: number = actionConfig.privacyWeight;

  return { basePoints, multiplier, totalPoints, privacyImpact };
}

/**
 * Calculate privacy score from user stats
 */
export function calculatePrivacyScore(stats: {
  hiddenBalance?: number;
  privateTransfers?: number;
  anonymousBets?: number;
  swapVolume?: number;
  streak?: number;
  badgeTier?: BadgeTier;
}): number {
  const config = PRIVACY_SCORE_CONFIG.weights;
  let score = 0;

  // Hidden balance contribution
  const hiddenBalance = stats.hiddenBalance || 0;
  score += Math.min(
    Math.floor(hiddenBalance / config.hiddenBalance.pointsPer) * config.hiddenBalance.pointsEach,
    config.hiddenBalance.max
  );

  // Private transfers contribution
  score += Math.min(
    (stats.privateTransfers || 0) * config.privateTransfers.pointsEach,
    config.privateTransfers.max
  );

  // Anonymous bets contribution
  score += Math.min(
    (stats.anonymousBets || 0) * config.anonymousBets.pointsEach,
    config.anonymousBets.max
  );

  // Swap volume contribution
  const swapVolume = stats.swapVolume || 0;
  score += Math.min(
    Math.floor(swapVolume / config.swapVolume.pointsPer) * config.swapVolume.pointsEach,
    config.swapVolume.max
  );

  // Streak contribution
  score += Math.min(
    (stats.streak || 0) * config.streak.pointsEach,
    config.streak.max
  );

  // Badge bonus
  const badgeTier = stats.badgeTier || 'none';
  score += BADGE_TIERS[badgeTier].privacyBonus;

  return Math.min(score, PRIVACY_SCORE_CONFIG.maxScore);
}

/**
 * Get all actions for a specific SDK
 */
export function getActionsForSdk(sdkId: string): PointAction[] {
  return (Object.entries(POINT_ACTIONS) as [PointAction, typeof POINT_ACTIONS[PointAction]][])
    .filter(([, config]) => config.sdk === sdkId)
    .map(([action]) => action);
}

/**
 * Get all actions for a specific category
 */
export function getActionsForCategory(category: string): PointAction[] {
  return (Object.entries(POINT_ACTIONS) as [PointAction, typeof POINT_ACTIONS[PointAction]][])
    .filter(([, config]) => config.category === category)
    .map(([action]) => action);
}

// Export for backwards compatibility
export const POINT_VALUES = Object.fromEntries(
  Object.entries(POINT_ACTIONS).map(([key, value]) => [key, value.basePoints])
) as Record<PointAction, number>;

export const BADGE_MULTIPLIERS = Object.fromEntries(
  Object.entries(BADGE_TIERS).map(([key, value]) => [key, value.multiplier])
) as Record<BadgeTier, number>;
