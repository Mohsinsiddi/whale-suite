/**
 * Complete Database Reset & Seed Script
 *
 * Run with: npx tsx scripts/seed-all.ts
 *
 * This will:
 * 1. Drop all collections
 * 2. Create indexes for fast queries
 * 3. Seed users, transactions, points history, whale feed, channels
 *
 * NOT seeded (created dynamically during use):
 * - Follow, Referral, CardOrder, Badge, ChannelMessage
 * - ConfidentialBadge, MultiSendBatch, PrivatePayment, ChannelMembership
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whale-suite';

// Configuration
const NUM_USERS = 100;
const TRANSACTIONS_PER_USER = { min: 5, max: 50 };
const BATCH_SIZE = 500;

// Types
const TRANSACTION_TYPES = [
  'privacy_deposit',
  'privacy_withdraw',
  'shadow_transfer',
  'jupiter_swap',
  'pnp_bet',
] as const;

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

const TOKENS = ['SOL', 'USDC', 'USDT', 'BONK', 'JTO', 'WIF'];

// Point actions (from config)
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

// Default channels
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

// Schemas (inline to avoid import issues)

// Profile settings schema (NEW)
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
  privyId: { type: String, sparse: true },
  userNumber: { type: Number, required: true, unique: true },
  badgeTier: { type: String, enum: BADGE_TIERS, default: 'none' },
  badgeMint: String,
  badgePurchasedAt: Date,
  isPremium: { type: Boolean, default: false },
  premiumExpiry: Date,
  privacyScore: { type: Number, default: 0 },
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
  // Profile settings (NEW)
  profile: { type: ProfileSettingsSchema, default: () => ({}) },
  // Legal (NEW)
  termsAcceptedAt: { type: Date },
  termsVersion: { type: String },
  points: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActiveDate: Date,
  rank: Number,
  lastLoginAt: { type: Date, default: Date.now },
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  wallet: { type: String, required: true },
  network: { type: String, enum: ['mainnet', 'devnet'], default: 'mainnet' },
  type: { type: String, enum: TRANSACTION_TYPES, required: true },
  amount: { type: Number, required: true },
  token: { type: String, default: 'SOL' },
  fee: Number,
  sdk: { type: String, enum: ['privacy-cash', 'shadow-wire', 'pnp', 'jupiter'] },
  signature: { type: String, required: true, unique: true },
  slot: Number,
  blockTime: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'confirmed' },
  errorMessage: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  confirmedAt: Date,
}, { timestamps: true });

const PointsHistorySchema = new mongoose.Schema({
  wallet: { type: String, required: true },
  action: { type: String, enum: POINT_ACTIONS, required: true },
  basePoints: { type: Number, required: true },
  multiplier: { type: Number, default: 1.0 },
  totalPoints: { type: Number, required: true },
  badgeTier: { type: String, enum: BADGE_TIERS, default: 'none' },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });

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

// Helper functions
function generateWallet(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 88; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateReferralCode(userNumber: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'WHALE';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code + userNumber;
}

function generateWhaleId(): string {
  const chars = 'ABCDEF0123456789';
  return 'Whale #' + Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10000) / 10000;
}

function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[0];
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

async function seedDatabase() {
  console.log('🚀 Starting database seed...\n');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  // Drop existing collections
  console.log('🗑️  Dropping existing collections...');
  const collections = ['users', 'transactions', 'pointshistories', 'whalefeeds', 'channels'];
  for (const col of collections) {
    try {
      await db.dropCollection(col);
      console.log(`   Dropped: ${col}`);
    } catch {
      // Collection might not exist
    }
  }
  console.log('');

  // Create models
  const User = mongoose.model('User', UserSchema);
  const Transaction = mongoose.model('Transaction', TransactionSchema);
  const PointsHistory = mongoose.model('PointsHistory', PointsHistorySchema);
  const WhaleFeed = mongoose.model('WhaleFeed', WhaleFeedSchema);
  const Channel = mongoose.model('Channel', ChannelSchema);

  // Create indexes
  console.log('📇 Creating indexes...');

  // User indexes
  await User.collection.createIndex({ wallet: 1 }, { unique: true });
  await User.collection.createIndex({ userNumber: 1 }, { unique: true });
  await User.collection.createIndex({ referralCode: 1 }, { unique: true });
  await User.collection.createIndex({ points: -1, streak: -1 }); // Leaderboard sort
  await User.collection.createIndex({ points: -1, createdAt: -1 });
  await User.collection.createIndex({ badgeTier: 1, points: -1 });
  await User.collection.createIndex({ privyId: 1 }, { sparse: true });
  await User.collection.createIndex({ lastActiveDate: 1, points: -1 }); // Period leaderboard
  await User.collection.createIndex({ 'profile.isPublic': 1, points: -1 }); // Public profiles
  console.log('   User indexes created');

  // Transaction indexes
  await Transaction.collection.createIndex({ signature: 1 }, { unique: true });
  await Transaction.collection.createIndex({ wallet: 1, createdAt: -1 });
  await Transaction.collection.createIndex({ wallet: 1, type: 1 });
  await Transaction.collection.createIndex({ wallet: 1, status: 1, createdAt: -1 });
  await Transaction.collection.createIndex({ status: 1, createdAt: -1 }); // Global feed
  await Transaction.collection.createIndex({ status: 1, type: 1, createdAt: -1 }); // Filtered global feed
  await Transaction.collection.createIndex({ wallet: 1, status: 1 }); // Transaction counts
  await Transaction.collection.createIndex({ type: 1, status: 1, createdAt: -1 });
  await Transaction.collection.createIndex({ createdAt: -1 });
  console.log('   Transaction indexes created');

  // PointsHistory indexes
  await PointsHistory.collection.createIndex({ wallet: 1, createdAt: -1 });
  await PointsHistory.collection.createIndex({ createdAt: -1 });
  await PointsHistory.collection.createIndex({ wallet: 1, action: 1, createdAt: -1 }); // Action queries
  console.log('   PointsHistory indexes created');

  // WhaleFeed indexes
  await WhaleFeed.collection.createIndex({ createdAt: -1 });
  await WhaleFeed.collection.createIndex({ whaleId: 1 });
  await WhaleFeed.collection.createIndex({ eventType: 1 });
  console.log('   WhaleFeed indexes created');

  // Channel indexes
  await Channel.collection.createIndex({ slug: 1 }, { unique: true });
  await Channel.collection.createIndex({ tier: 1, isActive: 1 });
  console.log('   Channel indexes created');
  console.log('');

  // Seed channels first
  console.log('📢 Seeding default channels...');
  await Channel.insertMany(DEFAULT_CHANNELS);
  console.log(`   ✅ Inserted ${DEFAULT_CHANNELS.length} channels\n`);

  // Generate users
  console.log(`👥 Generating ${NUM_USERS} users...`);
  const users = [];
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  for (let i = 1; i <= NUM_USERS; i++) {
    const wallet = generateWallet();
    const createdAt = new Date(now - Math.random() * thirtyDaysMs);
    const badgeTier = weightedRandom(
      [...BADGE_TIERS],
      [50, 20, 15, 8, 5, 2] // Most users have no badge
    );
    const points = randomBetween(0, 15000);
    const streak = randomBetween(0, 30);
    const hasBadge = badgeTier !== 'none';

    users.push({
      wallet,
      userNumber: i,
      badgeTier,
      isPremium: hasBadge,
      privacyScore: randomBetween(0, 1000),
      stats: {
        hiddenBalance: randomFloat(0, 100),
        privateTransfers: randomBetween(0, 100),
        anonymousBets: randomBetween(0, 50),
        swapVolume: randomFloat(0, 1000),
        activeDays: randomBetween(1, 60),
      },
      referralCode: generateReferralCode(i),
      points,
      streak,
      lastActiveDate: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000),
      lastLoginAt: new Date(now - Math.random() * 24 * 60 * 60 * 1000),
      // Profile settings (NEW)
      profile: {
        isPublic: hasBadge,
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
      // Legal (NEW)
      termsAcceptedAt: hasBadge ? createdAt : undefined,
      termsVersion: hasBadge ? '1.0' : undefined,
      createdAt,
      updatedAt: new Date(),
    });
  }

  await User.insertMany(users);
  console.log(`   ✅ Inserted ${users.length} users`);

  // Update ranks based on points
  console.log('   Updating user ranks...');
  const sortedUsers = await User.find().sort({ points: -1 }).lean();
  const bulkOps = sortedUsers.map((user, index) => ({
    updateOne: {
      filter: { _id: user._id },
      update: { $set: { rank: index + 1 } }
    }
  }));
  await User.bulkWrite(bulkOps);
  console.log('   ✅ Ranks updated\n');

  // Generate transactions and points history
  console.log('💳 Generating transactions...');
  const allTransactions: Record<string, unknown>[] = [];
  const allPointsHistory: Record<string, unknown>[] = [];

  const sdkMap: Record<string, string> = {
    privacy_deposit: 'privacy-cash',
    privacy_withdraw: 'privacy-cash',
    shadow_transfer: 'shadow-wire',
    jupiter_swap: 'jupiter',
    pnp_bet: 'pnp',
  };

  const pointsMap: Record<string, number> = {
    privacy_deposit: 15,
    privacy_withdraw: 8,
    shadow_transfer: 25,
    jupiter_swap: 5,
    pnp_bet: 20,
  };

  for (const user of users) {
    const numTx = randomBetween(TRANSACTIONS_PER_USER.min, TRANSACTIONS_PER_USER.max);

    for (let j = 0; j < numTx; j++) {
      const type = TRANSACTION_TYPES[Math.floor(Math.random() * TRANSACTION_TYPES.length)];
      const token = type === 'jupiter_swap'
        ? TOKENS[Math.floor(Math.random() * TOKENS.length)]
        : 'SOL';
      const amount = randomFloat(0.01, 50);
      const createdAt = new Date(now - Math.random() * thirtyDaysMs);

      // Build metadata for swaps
      const metadata: Record<string, unknown> = {};
      if (type === 'jupiter_swap') {
        const toToken = TOKENS.filter(t => t !== token)[Math.floor(Math.random() * (TOKENS.length - 1))];
        metadata.fromToken = token;
        metadata.toToken = toToken;
        metadata.toAmount = randomFloat(0.01, 100);
      }

      allTransactions.push({
        wallet: user.wallet,
        network: 'mainnet',
        type,
        amount,
        token,
        fee: randomFloat(0.0001, 0.005),
        sdk: sdkMap[type],
        signature: generateSignature(),
        slot: randomBetween(250000000, 260000000),
        blockTime: Math.floor(createdAt.getTime() / 1000),
        status: 'confirmed',
        metadata,
        createdAt,
        confirmedAt: createdAt,
      });

      // Create points history entry
      const basePoints = pointsMap[type] || 5;
      const multiplier = BADGE_MULTIPLIERS[user.badgeTier as BadgeTier];

      allPointsHistory.push({
        wallet: user.wallet,
        action: type,
        basePoints,
        multiplier,
        totalPoints: Math.floor(basePoints * multiplier),
        badgeTier: user.badgeTier,
        metadata: { amount, token },
        createdAt,
      });
    }
  }

  // Insert in batches
  console.log(`   Inserting ${allTransactions.length} transactions...`);
  for (let i = 0; i < allTransactions.length; i += BATCH_SIZE) {
    const batch = allTransactions.slice(i, i + BATCH_SIZE);
    await Transaction.insertMany(batch, { ordered: false }).catch(() => {});
  }
  console.log(`   ✅ Inserted transactions`);

  console.log(`   Inserting ${allPointsHistory.length} points history entries...`);
  for (let i = 0; i < allPointsHistory.length; i += BATCH_SIZE) {
    const batch = allPointsHistory.slice(i, i + BATCH_SIZE);
    await PointsHistory.insertMany(batch, { ordered: false }).catch(() => {});
  }
  console.log(`   ✅ Inserted points history\n`);

  // Generate whale feed events
  console.log('🐋 Generating whale feed events...');
  const whaleFeedEvents: Record<string, unknown>[] = [];
  const eventTypes = [
    { type: 'large_transfer', amounts: [500, 1000, 2500, 5000, 10000], token: 'SOL' },
    { type: 'privacy_deposit', amounts: [100, 250, 500, 1000, 2000], token: 'SOL' },
    { type: 'privacy_withdraw', amounts: [50, 100, 250, 500, 1000], token: 'SOL' },
    { type: 'token_swap', amounts: [10000, 25000, 50000, 100000, 250000], token: 'USDC' },
    { type: 'anonymous_bet', amounts: [10, 25, 50, 100, 500], token: 'SOL' },
  ];

  for (let i = 0; i < 100; i++) {
    const eventConfig = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const eventAmount = eventConfig.amounts[Math.floor(Math.random() * eventConfig.amounts.length)];
    const whaleId = generateWhaleId();
    const hoursBack = Math.floor(Math.random() * 168);

    let displayText = '';
    switch (eventConfig.type) {
      case 'large_transfer':
        displayText = `${whaleId} transferred ${eventAmount.toLocaleString()} ${eventConfig.token}`;
        break;
      case 'privacy_deposit':
        displayText = `${whaleId} shielded ${eventAmount.toLocaleString()} ${eventConfig.token}`;
        break;
      case 'privacy_withdraw':
        displayText = `${whaleId} unshielded ${eventAmount.toLocaleString()} ${eventConfig.token}`;
        break;
      case 'token_swap':
        displayText = `${whaleId} swapped $${eventAmount.toLocaleString()} ${eventConfig.token}`;
        break;
      case 'anonymous_bet':
        displayText = `${whaleId} placed ${eventAmount} ${eventConfig.token} anonymous bet`;
        break;
    }

    whaleFeedEvents.push({
      whaleId,
      walletHash: generateWallet().slice(0, 16),
      eventType: eventConfig.type,
      amount: eventAmount,
      token: eventConfig.token,
      usdValue: eventConfig.token === 'SOL' ? eventAmount * 150 : eventAmount,
      signature: generateSignature(),
      slot: 250000000 + Math.floor(Math.random() * 1000000),
      blockTime: Math.floor(hoursAgo(hoursBack).getTime() / 1000),
      displayText,
      createdAt: hoursAgo(hoursBack),
    });
  }

  await WhaleFeed.insertMany(whaleFeedEvents);
  console.log(`   ✅ Inserted ${whaleFeedEvents.length} whale feed events\n`);

  // Summary
  console.log('📊 Database Summary:');
  console.log(`   Users: ${await User.countDocuments()}`);
  console.log(`   Channels: ${await Channel.countDocuments()}`);
  console.log(`   Transactions: ${await Transaction.countDocuments()}`);
  console.log(`   Points History: ${await PointsHistory.countDocuments()}`);
  console.log(`   Whale Feed: ${await WhaleFeed.countDocuments()}`);

  // Badge distribution
  console.log('\n🏅 Badge Distribution:');
  for (const tier of BADGE_TIERS) {
    const count = await User.countDocuments({ badgeTier: tier });
    console.log(`   ${tier}: ${count}`);
  }

  // Transaction type distribution
  console.log('\n💳 Transaction Types:');
  for (const type of TRANSACTION_TYPES) {
    const count = await Transaction.countDocuments({ type });
    console.log(`   ${type}: ${count}`);
  }

  console.log(`
┌─────────────────────────────────────────────────────────┐
│  NOT SEEDED (created during use):                       │
│  - ConfidentialBadge, MultiSendBatch, PrivatePayment    │
│  - ChannelMembership, ChannelMessage                    │
│  - Follow, Referral, CardOrder, Badge                   │
└─────────────────────────────────────────────────────────┘
`);

  console.log('\n✅ Database seeding completed!');
  await mongoose.disconnect();
}

seedDatabase().catch(console.error);
