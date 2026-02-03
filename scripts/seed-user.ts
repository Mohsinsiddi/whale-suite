/**
 * Seed Script: Create comprehensive test data
 *
 * Run with: npx tsx scripts/seed-user.ts
 *
 * This seeds:
 * - Leaderboard competitors (so you're not alone)
 * - Whale feed events (so intelligence page has data)
 * - Default channels (for tier-based access)
 * - Channel memberships (for badge holders)
 * - Channel messages (sample conversations)
 * - NO data for your wallet (you start fresh to test)
 *
 * NOT seeded (created dynamically during use):
 * - Follow, Referral, CardOrder, Badge
 * - ConfidentialBadge, MultiSendBatch, PrivatePayment
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whale-suite';
const NETWORK: 'mainnet' | 'devnet' = 'mainnet';

// ============ BADGE TIERS (from config) ============

const BADGE_TIERS = ['none', 'bronze', 'silver', 'gold', 'diamond', 'legendary'] as const;
type BadgeTier = typeof BADGE_TIERS[number];

const BADGE_MULTIPLIERS: Record<BadgeTier, number> = {
  none: 1.0,
  bronze: 1.25,
  silver: 1.5,
  gold: 1.75,
  diamond: 2.0,
  legendary: 2.5,
};

// Badge tier to channel tier mapping (what channels each badge can access)
const BADGE_TO_MAX_TIER: Record<BadgeTier, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
  diamond: 4,
  legendary: 5,
};

// ============ POINT ACTIONS (from config) ============

const POINT_ACTIONS = [
  // Privacy Cash
  'privacy_deposit', 'privacy_withdraw',
  // ShadowWire
  'shadow_transfer', 'standard_transfer', 'multi_send',
  // Darklake
  'darklake_swap', 'darklake_provide_liquidity',
  // Jupiter
  'jupiter_swap',
  // PNP
  'pnp_bet', 'pnp_create_market', 'pnp_claim_winnings',
  // Anoncoin
  'token_launch',
  // Starpay
  'card_order', 'card_topup',
  // INCO Channels
  'channel_join', 'channel_participate',
  // Engagement
  'daily_login', 'referral', 'referral_purchase',
  // Badges
  'badge_bronze', 'badge_silver', 'badge_gold', 'badge_diamond', 'badge_legendary',
] as const;

type PointAction = typeof POINT_ACTIONS[number];

const POINT_VALUES: Partial<Record<PointAction, number>> = {
  privacy_deposit: 15,
  privacy_withdraw: 8,
  shadow_transfer: 25,
  standard_transfer: 5,
  multi_send: 30,
  darklake_swap: 35,
  darklake_provide_liquidity: 50,
  jupiter_swap: 5,
  pnp_bet: 20,
  pnp_create_market: 100,
  pnp_claim_winnings: 10,
  token_launch: 200,
  card_order: 75,
  card_topup: 15,
  channel_join: 20,
  channel_participate: 5,
  daily_login: 10,
  referral: 100,
  referral_purchase: 250,
  badge_bronze: 500,
  badge_silver: 1000,
  badge_gold: 2000,
  badge_diamond: 3500,
  badge_legendary: 5000,
};

// ============ SCHEMAS ============

// Profile settings schema
const ProfileSettingsSchema = new mongoose.Schema({
  isPublic: { type: Boolean, default: false },
  avatarUrl: { type: String },
  displayName: { type: String },
  visibleStats: {
    type: new mongoose.Schema({
      points: { type: Boolean, default: true },
      privacyScore: { type: Boolean, default: true },
      streak: { type: Boolean, default: true },
      rank: { type: Boolean, default: true },
      badges: { type: Boolean, default: true },
      transactions: { type: Boolean, default: false },
      hiddenVolume: { type: Boolean, default: false },
      memberSince: { type: Boolean, default: true },
      activity: { type: Boolean, default: false },
    }, { _id: false }),
    default: () => ({
      points: true,
      privacyScore: true,
      streak: true,
      rank: true,
      badges: true,
      transactions: false,
      hiddenVolume: false,
      memberSince: true,
      activity: false,
    }),
  },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  wallet: { type: String, required: true, unique: true },
  email: String,
  privyId: String,
  userNumber: { type: Number, required: true, unique: true },
  badgeTier: {
    type: String,
    enum: BADGE_TIERS,
    default: 'none'
  },
  badgeMint: String,
  badgePurchasedAt: Date,
  isPremium: { type: Boolean, default: false },
  premiumExpiry: Date,
  privacyScore: { type: Number, default: 0, min: 0, max: 1000 },
  points: { type: Number, default: 0, index: true },
  streak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  rank: { type: Number },
  stats: {
    hiddenBalance: { type: Number, default: 0 },
    privateTransfers: { type: Number, default: 0 },
    anonymousBets: { type: Number, default: 0 },
    swapVolume: { type: Number, default: 0 },
    activeDays: { type: Number, default: 0 },
  },
  referralCode: { type: String, required: true, unique: true },
  referredBy: String,
  settings: {
    notifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: false },
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'dark' },
  },
  profile: { type: ProfileSettingsSchema, default: () => ({}) },
  termsAcceptedAt: { type: Date },
  termsVersion: { type: String },
  lastLoginAt: { type: Date, default: Date.now },
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  wallet: { type: String, required: true },
  network: { type: String, enum: ['mainnet', 'devnet'], required: true, default: 'mainnet' },
  type: {
    type: String,
    enum: ['privacy_deposit', 'privacy_withdraw', 'shadow_transfer', 'pnp_bet',
           'jupiter_swap', 'badge_purchase', 'subscription_payment', 'referral_payout', 'card_order'],
    required: true
  },
  amount: { type: Number, required: true },
  token: String,
  fee: Number,
  sdk: { type: String, enum: ['privacy-cash', 'shadow-wire', 'pnp', 'jupiter'] },
  signature: { type: String, required: true, unique: true },
  slot: Number,
  blockTime: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  errorMessage: String,
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  confirmedAt: Date,
}, { timestamps: true });

const WhaleFeedSchema = new mongoose.Schema({
  whaleId: { type: String, required: true },
  walletHash: { type: String, required: true },
  eventType: {
    type: String,
    enum: ['large_transfer', 'privacy_deposit', 'privacy_withdraw', 'token_swap', 'anonymous_bet'],
    required: true
  },
  amount: Number,
  token: String,
  usdValue: Number,
  signature: { type: String, required: true },
  slot: Number,
  blockTime: Number,
  displayText: { type: String, required: true },
}, { timestamps: true });

const PointsHistorySchema = new mongoose.Schema({
  wallet: { type: String, required: true, index: true },
  action: {
    type: String,
    enum: POINT_ACTIONS,
    required: true
  },
  basePoints: { type: Number, required: true },
  multiplier: { type: Number, required: true, default: 1 },
  totalPoints: { type: Number, required: true },
  badgeTier: { type: String, enum: BADGE_TIERS, default: 'none' },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const ChannelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  tier: { type: Number, required: true, min: 1, max: 5, index: true },
  tierName: { type: String, required: true, enum: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Legendary'] },
  icon: { type: String, default: '💬' },
  memberCount: { type: Number, default: 0 },
  messageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const ChannelMembershipSchema = new mongoose.Schema({
  wallet: { type: String, required: true, index: true },
  channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
  badgePda: { type: String, index: true, sparse: true },
  badgeId: { type: String, sparse: true },
  anonId: { type: String, required: true, index: true },
  verifiedAt: { type: Date, default: Date.now },
  verificationSignature: { type: String, required: true },
  grantAccessTx: { type: String, sparse: true },
  isActive: { type: Boolean, default: true, index: true },
  isMuted: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  notifications: { type: Boolean, default: true },
}, { timestamps: true });

const ActivityDataSchema = new mongoose.Schema({
  type: { type: String, enum: ['swap', 'transfer', 'deposit', 'withdraw', 'bet', 'badge_claim'], required: true },
  token: String,
  amount: Number,
  fromToken: String,
  toToken: String,
  txSignature: String,
  description: String,
}, { _id: false });

const ChannelMessageSchema = new mongoose.Schema({
  channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
  membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelMembership', required: true, index: true },
  content: { type: String, required: true, maxlength: 2000 },
  contentType: { type: String, enum: ['text', 'image', 'link', 'activity'], default: 'text' },
  activityData: { type: ActivityDataSchema },
  senderAnonId: { type: String, required: true },
  senderWallet: { type: String, required: true, index: true },
  reactions: { type: Map, of: [String], default: new Map() },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelMessage' },
  isDeleted: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false, index: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const WhaleFeed = mongoose.models.WhaleFeed || mongoose.model('WhaleFeed', WhaleFeedSchema);
const PointsHistory = mongoose.models.PointsHistory || mongoose.model('PointsHistory', PointsHistorySchema);
const Channel = mongoose.models.Channel || mongoose.model('Channel', ChannelSchema);
const ChannelMembership = mongoose.models.ChannelMembership || mongoose.model('ChannelMembership', ChannelMembershipSchema);
const ChannelMessage = mongoose.models.ChannelMessage || mongoose.model('ChannelMessage', ChannelMessageSchema);

// ============ DEFAULT DATA ============

const DEFAULT_CHANNELS = [
  {
    name: 'Bronze Lounge',
    slug: 'bronze-lounge',
    description: 'Welcome to the Bronze tier! Connect with fellow whales starting their privacy journey.',
    tier: 1,
    tierName: 'Bronze',
    icon: '🥉',
    isDefault: true,
  },
  {
    name: 'Silver Circle',
    slug: 'silver-circle',
    description: 'Exclusive discussions for Silver badge holders. Share strategies and insights.',
    tier: 2,
    tierName: 'Silver',
    icon: '🥈',
    isDefault: true,
  },
  {
    name: 'Gold Vault',
    slug: 'gold-vault',
    description: 'Premium channel for Gold members. Alpha leaks and whale coordination.',
    tier: 3,
    tierName: 'Gold',
    icon: '🥇',
    isDefault: true,
  },
  {
    name: 'Diamond Den',
    slug: 'diamond-den',
    description: 'Elite discussions for Diamond whales. High-stakes coordination and OTC deals.',
    tier: 4,
    tierName: 'Diamond',
    icon: '💎',
    isDefault: true,
  },
  {
    name: 'Legendary Council',
    slug: 'legendary-council',
    description: 'The inner circle. Legendary whales only. Market-moving discussions.',
    tier: 5,
    tierName: 'Legendary',
    icon: '👑',
    isDefault: true,
  },
];

// Sample messages for each channel tier
const SAMPLE_MESSAGES: Record<number, string[]> = {
  1: [ // Bronze
    'Just got my Bronze badge! Excited to start my privacy journey 🐋',
    'Anyone else using Privacy Cash for the first time?',
    'The stealth features on ShadowWire are amazing',
    'gm frens, happy to be here',
    'How do I increase my privacy score?',
    'Just made my first private transfer!',
    'This platform is exactly what I needed',
    'The UI is so clean, love the dark theme',
  ],
  2: [ // Silver
    'Silver gang checking in 🥈',
    'Pro tip: Use multi-send for batch transfers, saves on fees',
    'Just reached 500 privacy score, grinding to 1000',
    'The Darklake integration is game-changing',
    'Anyone doing OTC here? DM me',
    'My hidden balance is growing nicely',
    'Silver benefits are worth every SOL',
  ],
  3: [ // Gold
    'Gold Vault activated 🥇',
    'Market looks bullish, accumulating privately',
    'Alpha: Big whale activity on Jupiter today',
    'Just bridged 1000 SOL through Privacy Cash',
    'The affiliate commissions are printing',
    'Who else is stacking in stealth mode?',
    'Gold tier support is top notch',
  ],
  4: [ // Diamond
    'Diamond hands, diamond badge 💎',
    'Coordinating a large OTC deal, need escrow',
    'Privacy score maxed at 1000 finally',
    'The whale feed intel is incredibly accurate',
    'Just moved 5 figures completely anonymously',
    'Diamond perks: worth every penny',
  ],
  5: [ // Legendary
    'Legendary Council in session 👑',
    'Market-moving discussion: SOL accumulation zones',
    'Coordinated buy incoming, stay ready',
    'Revenue share hitting different this month',
    'The inner circle delivers as always',
  ],
};

// Activity messages with transaction data
const ACTIVITY_MESSAGES: Array<{
  tier: number;
  content: string;
  activityData: {
    type: 'swap' | 'transfer' | 'deposit' | 'withdraw' | 'bet' | 'badge_claim';
    token?: string;
    amount?: number;
    fromToken?: string;
    toToken?: string;
    description?: string;
  };
}> = [
  { tier: 1, content: 'Just shielded some SOL!', activityData: { type: 'deposit', token: 'SOL', amount: 50, description: 'Deposited to Privacy Cash' } },
  { tier: 2, content: 'Private swap executed', activityData: { type: 'swap', fromToken: 'SOL', toToken: 'USDC', amount: 200, description: 'Swapped via Darklake' } },
  { tier: 3, content: 'Whale transfer complete', activityData: { type: 'transfer', token: 'SOL', amount: 500, description: 'Private transfer via ShadowWire' } },
  { tier: 4, content: 'Anonymous bet placed', activityData: { type: 'bet', token: 'SOL', amount: 100, description: 'Prediction market bet' } },
  { tier: 5, content: 'Major move executed', activityData: { type: 'withdraw', token: 'SOL', amount: 1000, description: 'Withdrew from Privacy Cash' } },
];

// ============ HELPERS ============

function generateSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  return Array.from({ length: 88 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function generateWallet(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  return Array.from({ length: 44 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function generateWhaleId(): string {
  const chars = 'ABCDEF0123456789';
  return 'Whale #' + Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function generateAnonId(): string {
  const chars = '0123456789ABCDEF';
  return 'Whale#' + Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

function log(emoji: string, msg: string) {
  console.log(`${emoji}  ${msg}`);
}

function logTable(title: string, data: Record<string, unknown>[]) {
  console.log(`\n📊 ${title}`);
  console.table(data);
}

// ============ SEED FUNCTIONS ============

async function dropAllCollections() {
  log('🗑️', 'Dropping all collections...');

  const db = mongoose.connection.db;
  if (!db) {
    log('⚠️', 'Database not connected, skipping collection drop');
    return;
  }

  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    await db.dropCollection(collection.name);
    log('  ❌', `Dropped ${collection.name}`);
  }

  log('✅', 'All collections dropped');
}

async function seedChannels() {
  log('📢', 'Creating default channels...');

  const channels = await Channel.insertMany(DEFAULT_CHANNELS);

  log('✅', `Created ${DEFAULT_CHANNELS.length} default channels`);
  logTable('Channels', DEFAULT_CHANNELS.map(c => ({
    Channel: c.name,
    Tier: c.tierName,
    Icon: c.icon,
  })));

  return channels;
}

async function seedLeaderboardCompetitors() {
  log('🏆', 'Creating leaderboard competitors...');

  const competitors = [
    { userNumber: 1, points: 45000, streak: 30, badge: 'legendary' as BadgeTier, name: 'Legendary Titan' },
    { userNumber: 7, points: 32000, streak: 21, badge: 'diamond' as BadgeTier, name: 'Diamond Whale' },
    { userNumber: 13, points: 25000, streak: 18, badge: 'diamond' as BadgeTier, name: 'Shadow Master' },
    { userNumber: 42, points: 18500, streak: 14, badge: 'gold' as BadgeTier, name: 'Gold Phantom' },
    { userNumber: 77, points: 15000, streak: 12, badge: 'gold' as BadgeTier, name: 'Privacy King' },
    { userNumber: 88, points: 12000, streak: 10, badge: 'gold' as BadgeTier, name: 'Ghost Trader' },
    { userNumber: 123, points: 9800, streak: 7, badge: 'silver' as BadgeTier, name: 'Silver Fox' },
    { userNumber: 156, points: 7500, streak: 5, badge: 'silver' as BadgeTier, name: 'Anon Whale' },
    { userNumber: 234, points: 5200, streak: 4, badge: 'bronze' as BadgeTier, name: 'Bronze Bull' },
    { userNumber: 345, points: 3500, streak: 3, badge: 'bronze' as BadgeTier, name: 'Rising Star' },
    { userNumber: 456, points: 2100, streak: 2, badge: 'none' as BadgeTier, name: 'New Whale' },
    { userNumber: 567, points: 1500, streak: 1, badge: 'none' as BadgeTier, name: 'Rookie' },
    { userNumber: 678, points: 800, streak: 0, badge: 'none' as BadgeTier, name: 'Beginner' },
    { userNumber: 789, points: 400, streak: 0, badge: 'none' as BadgeTier, name: 'Starter' },
    { userNumber: 890, points: 100, streak: 0, badge: 'none' as BadgeTier, name: 'Newbie' },
  ];

  const pointsHistories: Record<string, unknown>[] = [];
  const createdUsers: Array<{ wallet: string; badge: BadgeTier; name: string; anonId: string; _id: mongoose.Types.ObjectId }> = [];

  for (const comp of competitors) {
    const wallet = generateWallet();
    const activeDaysAgo = Math.floor(Math.random() * 3);
    const hasBadge = comp.badge !== 'none';
    const anonId = generateAnonId();

    const user = {
      wallet,
      userNumber: comp.userNumber,
      badgeTier: comp.badge,
      badgeMint: hasBadge ? generateWallet() : undefined,
      badgePurchasedAt: hasBadge ? daysAgo(Math.floor(Math.random() * 60) + 10) : undefined,
      isPremium: hasBadge,
      premiumExpiry: hasBadge ? new Date(Date.now() + 300 * 24 * 60 * 60 * 1000) : undefined,
      privacyScore: Math.floor(Math.random() * 500) + (hasBadge ? 300 : 100),
      points: comp.points,
      streak: comp.streak,
      lastActiveDate: daysAgo(activeDaysAgo),
      stats: {
        hiddenBalance: Math.floor(Math.random() * 1000) + 100,
        privateTransfers: Math.floor(comp.points / 100),
        anonymousBets: Math.floor(Math.random() * 50),
        swapVolume: Math.floor(Math.random() * 100000) + 10000,
        activeDays: comp.streak + Math.floor(Math.random() * 30),
      },
      referralCode: `WHALE${comp.userNumber}`,
      profile: {
        isPublic: hasBadge,
        displayName: hasBadge ? comp.name : undefined,
        visibleStats: {
          points: true,
          privacyScore: true,
          streak: true,
          rank: true,
          badges: true,
          transactions: false,
          hiddenVolume: false,
          memberSince: true,
          activity: false,
        },
      },
      termsAcceptedAt: hasBadge ? daysAgo(Math.floor(Math.random() * 60) + 10) : undefined,
      termsVersion: hasBadge ? '1.0' : undefined,
    };

    const createdUser = await User.create(user);
    createdUsers.push({ wallet, badge: comp.badge, name: comp.name, anonId, _id: createdUser._id });

    // Add some points history for users with badges
    if (hasBadge) {
      const actions: PointAction[] = ['privacy_deposit', 'shadow_transfer', 'jupiter_swap', 'daily_login', 'channel_join'];
      for (let i = 0; i < 5; i++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const basePoints = POINT_VALUES[action] || 10;
        const multiplier = BADGE_MULTIPLIERS[comp.badge];

        pointsHistories.push({
          wallet,
          action,
          basePoints,
          multiplier,
          totalPoints: Math.floor(basePoints * multiplier),
          badgeTier: comp.badge,
          createdAt: hoursAgo(Math.floor(Math.random() * 168)),
        });
      }
    }
  }

  if (pointsHistories.length > 0) {
    await PointsHistory.insertMany(pointsHistories);
  }

  log('✅', `Created ${competitors.length} leaderboard competitors`);
  logTable('Top 10 Leaderboard', competitors.slice(0, 10).map((c, i) => ({
    Rank: i + 1,
    User: `Whale #${c.userNumber}`,
    Points: c.points.toLocaleString(),
    Streak: `${c.streak}d`,
    Badge: c.badge,
  })));

  return createdUsers;
}

async function seedChannelMembershipsAndMessages(
  channels: mongoose.Document[],
  users: Array<{ wallet: string; badge: BadgeTier; name: string; anonId: string; _id: mongoose.Types.ObjectId }>
) {
  log('💬', 'Creating channel memberships and messages...');

  const memberships: Record<string, unknown>[] = [];
  const messages: Record<string, unknown>[] = [];

  // Get badge holders only
  const badgeHolders = users.filter(u => u.badge !== 'none');

  for (const user of badgeHolders) {
    const maxTier = BADGE_TO_MAX_TIER[user.badge];

    // Create memberships for all channels up to user's max tier
    for (const channel of channels) {
      const channelTier = (channel as unknown as { tier: number }).tier;
      if (channelTier <= maxTier) {
        const membership = {
          wallet: user.wallet,
          channelId: channel._id,
          badgePda: user.wallet, // Using wallet as mock PDA
          anonId: user.anonId,
          verifiedAt: daysAgo(Math.floor(Math.random() * 30)),
          verificationSignature: generateSignature(),
          isActive: true,
          joinedAt: daysAgo(Math.floor(Math.random() * 30)),
          lastSeenAt: hoursAgo(Math.floor(Math.random() * 24)),
        };
        memberships.push(membership);
      }
    }
  }

  // Insert all memberships
  const createdMemberships = await ChannelMembership.insertMany(memberships);
  log('  ✅', `Created ${createdMemberships.length} channel memberships`);

  // Create messages for each channel
  for (const channel of channels) {
    const channelTier = (channel as unknown as { tier: number }).tier;
    const channelMemberships = createdMemberships.filter(
      m => m.channelId.toString() === channel._id.toString()
    );

    if (channelMemberships.length === 0) continue;

    // Get sample messages for this tier
    const tierMessages = SAMPLE_MESSAGES[channelTier] || [];
    const tierActivityMsgs = ACTIVITY_MESSAGES.filter(a => a.tier === channelTier);

    // Create regular text messages
    for (let i = 0; i < tierMessages.length; i++) {
      const membership = channelMemberships[i % channelMemberships.length];
      const memberData = memberships.find(
        m => (m as { wallet: string }).wallet === membership.wallet &&
             (m as { channelId: mongoose.Types.ObjectId }).channelId.toString() === channel._id.toString()
      ) as { wallet: string; anonId: string } | undefined;

      if (!memberData) continue;

      messages.push({
        channelId: channel._id,
        membershipId: membership._id,
        content: tierMessages[i],
        contentType: 'text',
        senderAnonId: memberData.anonId,
        senderWallet: memberData.wallet,
        isDeleted: false,
        isEdited: false,
        isPinned: i === 0, // Pin first message in each channel
        createdAt: hoursAgo(tierMessages.length - i + Math.random() * 2),
      });
    }

    // Create activity messages
    for (const activityMsg of tierActivityMsgs) {
      const membership = channelMemberships[Math.floor(Math.random() * channelMemberships.length)];
      const memberData = memberships.find(
        m => (m as { wallet: string }).wallet === membership.wallet &&
             (m as { channelId: mongoose.Types.ObjectId }).channelId.toString() === channel._id.toString()
      ) as { wallet: string; anonId: string } | undefined;

      if (!memberData) continue;

      messages.push({
        channelId: channel._id,
        membershipId: membership._id,
        content: activityMsg.content,
        contentType: 'activity',
        activityData: {
          ...activityMsg.activityData,
          txSignature: generateSignature(),
        },
        senderAnonId: memberData.anonId,
        senderWallet: memberData.wallet,
        isDeleted: false,
        isEdited: false,
        isPinned: false,
        createdAt: hoursAgo(Math.floor(Math.random() * 48)),
      });
    }
  }

  // Insert all messages
  if (messages.length > 0) {
    await ChannelMessage.insertMany(messages);
  }

  // Update channel message counts
  for (const channel of channels) {
    const messageCount = messages.filter(
      m => (m as { channelId: mongoose.Types.ObjectId }).channelId.toString() === channel._id.toString()
    ).length;
    const memberCount = createdMemberships.filter(
      m => m.channelId.toString() === channel._id.toString()
    ).length;

    await Channel.findByIdAndUpdate(channel._id, {
      messageCount,
      memberCount,
    });
  }

  log('  ✅', `Created ${messages.length} channel messages`);
  logTable('Channel Activity', channels.map(c => {
    const ch = c as unknown as { name: string; tierName: string; _id: mongoose.Types.ObjectId };
    return {
      Channel: ch.name,
      Tier: ch.tierName,
      Members: createdMemberships.filter(m => m.channelId.toString() === ch._id.toString()).length,
      Messages: messages.filter(m => (m as { channelId: mongoose.Types.ObjectId }).channelId.toString() === ch._id.toString()).length,
    };
  }));
}

async function seedWhaleFeed() {
  log('🐋', 'Creating whale feed events...');

  const events = [];
  const eventTypes = [
    { type: 'large_transfer', amounts: [500, 1000, 2500, 5000, 10000], token: 'SOL' },
    { type: 'privacy_deposit', amounts: [100, 250, 500, 1000, 2000], token: 'SOL' },
    { type: 'privacy_withdraw', amounts: [50, 100, 250, 500, 1000], token: 'SOL' },
    { type: 'token_swap', amounts: [10000, 25000, 50000, 100000, 250000], token: 'USDC' },
    { type: 'anonymous_bet', amounts: [10, 25, 50, 100, 500], token: 'SOL' },
  ];

  for (let i = 0; i < 50; i++) {
    const eventConfig = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const amount = eventConfig.amounts[Math.floor(Math.random() * eventConfig.amounts.length)];
    const whaleId = generateWhaleId();
    const hoursBack = Math.floor(Math.random() * 168);

    let displayText = '';
    switch (eventConfig.type) {
      case 'large_transfer':
        displayText = `${whaleId} transferred ${amount.toLocaleString()} ${eventConfig.token}`;
        break;
      case 'privacy_deposit':
        displayText = `${whaleId} shielded ${amount.toLocaleString()} ${eventConfig.token}`;
        break;
      case 'privacy_withdraw':
        displayText = `${whaleId} unshielded ${amount.toLocaleString()} ${eventConfig.token}`;
        break;
      case 'token_swap':
        displayText = `${whaleId} swapped $${amount.toLocaleString()} ${eventConfig.token}`;
        break;
      case 'anonymous_bet':
        displayText = `${whaleId} placed ${amount} ${eventConfig.token} anonymous bet`;
        break;
    }

    events.push({
      whaleId,
      walletHash: generateWallet().slice(0, 16),
      eventType: eventConfig.type,
      amount,
      token: eventConfig.token,
      usdValue: eventConfig.token === 'SOL' ? amount * 150 : amount,
      signature: generateSignature(),
      slot: 250000000 + Math.floor(Math.random() * 1000000),
      blockTime: Math.floor(hoursAgo(hoursBack).getTime() / 1000),
      displayText,
      createdAt: hoursAgo(hoursBack),
    });
  }

  events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  await WhaleFeed.insertMany(events);

  log('✅', `Created ${events.length} whale feed events`);
  logTable('Recent Whale Activity', events.slice(0, 5).map(e => ({
    Whale: e.whaleId,
    Event: e.eventType,
    Amount: `${e.amount} ${e.token}`,
    Time: `${Math.floor((Date.now() - e.createdAt.getTime()) / 3600000)}h ago`,
  })));
}

async function seedSampleTransactions(
  users: Array<{ wallet: string; badge: BadgeTier; name: string; anonId: string; _id: mongoose.Types.ObjectId }>
) {
  log('💸', 'Creating sample transactions for competitors...');

  const transactions = [];
  const badgeHolders = users.filter(u => u.badge !== 'none');

  for (const user of badgeHolders) {
    const txTypes = [
      { type: 'privacy_deposit', sdk: 'privacy-cash', amounts: [50, 100, 200, 500] },
      { type: 'shadow_transfer', sdk: 'shadow-wire', amounts: [25, 50, 100, 200] },
      { type: 'jupiter_swap', sdk: 'jupiter', amounts: [100, 250, 500, 1000] },
    ];

    const txCount = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < txCount; i++) {
      const txConfig = txTypes[Math.floor(Math.random() * txTypes.length)];
      const amount = txConfig.amounts[Math.floor(Math.random() * txConfig.amounts.length)];
      const hoursBack = Math.floor(Math.random() * 168);

      transactions.push({
        userId: user._id,
        wallet: user.wallet,
        network: NETWORK,
        type: txConfig.type,
        amount,
        token: 'SOL',
        fee: 0.000005,
        sdk: txConfig.sdk,
        signature: generateSignature(),
        slot: 250000000 + Math.floor(Math.random() * 1000000),
        blockTime: Math.floor(hoursAgo(hoursBack).getTime() / 1000),
        status: 'confirmed',
        createdAt: hoursAgo(hoursBack),
        confirmedAt: hoursAgo(hoursBack),
      });
    }
  }

  if (transactions.length > 0) {
    await Transaction.insertMany(transactions);
  }

  log('✅', `Created ${transactions.length} sample transactions`);
}

// ============ MAIN ============

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🐋 WHALE SUITE - FRESH DATABASE SEED');
  console.log('='.repeat(60) + '\n');

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!\n');

  try {
    // 1. Drop everything
    await dropAllCollections();

    // 2. Seed default channels
    const channels = await seedChannels();

    // 3. Seed leaderboard competitors
    const users = await seedLeaderboardCompetitors();

    // 4. Seed channel memberships and messages
    await seedChannelMembershipsAndMessages(channels, users);

    // 5. Seed whale feed
    await seedWhaleFeed();

    // 6. Seed sample transactions
    await seedSampleTransactions(users);

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

    const userCount = await User.countDocuments();
    const feedCount = await WhaleFeed.countDocuments();
    const txCount = await Transaction.countDocuments();
    const channelCount = await Channel.countDocuments();
    const pointsCount = await PointsHistory.countDocuments();
    const membershipCount = await ChannelMembership.countDocuments();
    const messageCount = await ChannelMessage.countDocuments();

    console.log(`
┌─────────────────────────────────────────────────────────┐
│  DATABASE SEEDED                                        │
├─────────────────────────────────────────────────────────┤
│  Users (Competitors):    ${String(userCount).padEnd(30)}│
│  Channels:               ${String(channelCount).padEnd(30)}│
│  Channel Memberships:    ${String(membershipCount).padEnd(30)}│
│  Channel Messages:       ${String(messageCount).padEnd(30)}│
│  Whale Feed Events:      ${String(feedCount).padEnd(30)}│
│  Transactions:           ${String(txCount).padEnd(30)}│
│  Points History:         ${String(pointsCount).padEnd(30)}│
├─────────────────────────────────────────────────────────┤
│  YOUR WALLET: NOT SEEDED (start fresh!)                 │
│                                                         │
│  When you connect, you'll be a NEW user with:           │
│  - 0 points                                             │
│  - 0 streak                                             │
│  - No badge                                             │
│                                                         │
│  Buy a badge to access exclusive channels!              │
├─────────────────────────────────────────────────────────┤
│  NOT SEEDED (created during use):                       │
│  - ConfidentialBadge, MultiSendBatch, PrivatePayment    │
│  - Follow, Referral, CardOrder, Badge                   │
└─────────────────────────────────────────────────────────┘
`);

  } catch (error) {
    console.error('❌ Error seeding:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB\n');
  }
}

main().catch(console.error);
