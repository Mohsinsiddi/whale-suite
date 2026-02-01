/**
 * Seed Script: Create comprehensive test data
 *
 * Run with: npx tsx scripts/seed-user.ts
 *
 * This seeds:
 * - Leaderboard competitors (so you're not alone)
 * - Whale feed events (so intelligence page has data)
 * - NO data for your wallet (you start fresh to test)
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whale-suite';
const NETWORK: 'mainnet' | 'devnet' = 'mainnet';

// ============ SCHEMAS ============

const UserSchema = new mongoose.Schema({
  wallet: { type: String, required: true, unique: true },
  email: String,
  privyId: String,
  userNumber: { type: Number, required: true, unique: true },
  badgeTier: {
    type: String,
    enum: ['none', 'bronze', 'silver', 'gold', 'diamond', 'legendary'],
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
    enum: [
      'privacy_deposit', 'privacy_withdraw', 'shadow_transfer', 'standard_transfer',
      'jupiter_swap', 'pnp_bet', 'pnp_win', 'card_order', 'badge_purchase',
      'referral_signup', 'referral_conversion', 'daily_login', 'streak_bonus',
      'first_transaction', 'whale_status',
    ],
    required: true
  },
  basePoints: { type: Number, required: true },
  multiplier: { type: Number, required: true, default: 1 },
  totalPoints: { type: Number, required: true },
  badgeTier: { type: String, enum: ['none', 'bronze', 'silver', 'gold', 'diamond', 'legendary'], default: 'none' },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const BadgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wallet: { type: String, required: true },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'diamond', 'legendary'], required: true },
  mintAddress: { type: String, required: true, unique: true },
  purchasePrice: { type: Number, required: true },
  txSignature: { type: String, required: true },
  status: { type: String, enum: ['active', 'upgraded', 'sold'], default: 'active' },
  metadata: {
    name: { type: String, required: true },
    image: { type: String, required: true },
    attributes: { type: Map, of: mongoose.Schema.Types.Mixed },
  },
  purchasedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const WhaleFeed = mongoose.models.WhaleFeed || mongoose.model('WhaleFeed', WhaleFeedSchema);
const PointsHistory = mongoose.models.PointsHistory || mongoose.model('PointsHistory', PointsHistorySchema);
const Badge = mongoose.models.Badge || mongoose.model('Badge', BadgeSchema);

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

async function seedLeaderboardCompetitors() {
  log('🏆', 'Creating leaderboard competitors...');

  const competitors = [
    { userNumber: 1, points: 45000, streak: 30, badge: 'legendary', name: 'Legendary Titan' },
    { userNumber: 7, points: 32000, streak: 21, badge: 'diamond', name: 'Diamond Whale' },
    { userNumber: 13, points: 25000, streak: 18, badge: 'diamond', name: 'Shadow Master' },
    { userNumber: 42, points: 18500, streak: 14, badge: 'gold', name: 'Gold Phantom' },
    { userNumber: 77, points: 15000, streak: 12, badge: 'gold', name: 'Privacy King' },
    { userNumber: 88, points: 12000, streak: 10, badge: 'gold', name: 'Ghost Trader' },
    { userNumber: 123, points: 9800, streak: 7, badge: 'silver', name: 'Silver Fox' },
    { userNumber: 156, points: 7500, streak: 5, badge: 'silver', name: 'Anon Whale' },
    { userNumber: 234, points: 5200, streak: 4, badge: 'bronze', name: 'Bronze Bull' },
    { userNumber: 345, points: 3500, streak: 3, badge: 'bronze', name: 'Rising Star' },
    { userNumber: 456, points: 2100, streak: 2, badge: 'none', name: 'New Whale' },
    { userNumber: 567, points: 1500, streak: 1, badge: 'none', name: 'Rookie' },
    { userNumber: 678, points: 800, streak: 0, badge: 'none', name: 'Beginner' },
    { userNumber: 789, points: 400, streak: 0, badge: 'none', name: 'Starter' },
    { userNumber: 890, points: 100, streak: 0, badge: 'none', name: 'Newbie' },
  ];

  const users = [];
  const badges = [];
  const pointsHistories = [];

  for (const comp of competitors) {
    const wallet = generateWallet();
    const activeDaysAgo = Math.floor(Math.random() * 3);
    const hasBadge = comp.badge !== 'none';

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
    };

    users.push(user);

    // Create badge for users with badges
    if (hasBadge) {
      const createdUser = await User.create(user);
      badges.push({
        userId: createdUser._id,
        wallet,
        tier: comp.badge,
        mintAddress: user.badgeMint,
        purchasePrice: comp.badge === 'legendary' ? 25 : comp.badge === 'diamond' ? 10 : comp.badge === 'gold' ? 5 : comp.badge === 'silver' ? 2 : 0.5,
        txSignature: generateSignature(),
        status: 'active',
        metadata: {
          name: `Whale Suite - ${comp.badge.charAt(0).toUpperCase() + comp.badge.slice(1)}`,
          image: `https://whale-suite.com/nft/${comp.badge}.png`,
        },
        purchasedAt: user.badgePurchasedAt,
      });

      // Add some points history for this user
      const actions = ['privacy_deposit', 'shadow_transfer', 'jupiter_swap', 'daily_login'];
      for (let i = 0; i < 5; i++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const basePoints = action === 'privacy_deposit' ? 100 : action === 'shadow_transfer' ? 150 : action === 'jupiter_swap' ? 75 : 10;
        const multiplier = comp.badge === 'legendary' ? 2.5 : comp.badge === 'diamond' ? 2.0 : comp.badge === 'gold' ? 1.75 : comp.badge === 'silver' ? 1.5 : comp.badge === 'bronze' ? 1.25 : 1.0;

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
    } else {
      await User.create(user);
    }
  }

  if (badges.length > 0) {
    await Badge.insertMany(badges);
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

  // Create 50 whale feed events spread over the last 7 days
  for (let i = 0; i < 50; i++) {
    const eventConfig = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const amount = eventConfig.amounts[Math.floor(Math.random() * eventConfig.amounts.length)];
    const whaleId = generateWhaleId();
    const hoursBack = Math.floor(Math.random() * 168); // Last 7 days

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

  // Sort by time (most recent first)
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

async function seedSampleTransactions() {
  log('💸', 'Creating sample transactions for competitors...');

  // Get some users to add transactions to
  const users = await User.find({ points: { $gt: 5000 } }).limit(5).lean();
  const transactions = [];

  for (const user of users) {
    const txTypes = [
      { type: 'privacy_deposit', sdk: 'privacy-cash', amounts: [50, 100, 200, 500] },
      { type: 'shadow_transfer', sdk: 'shadow-wire', amounts: [25, 50, 100, 200] },
      { type: 'jupiter_swap', sdk: 'jupiter', amounts: [100, 250, 500, 1000] },
    ];

    // Add 5-10 transactions per user
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

    // 2. Seed leaderboard competitors
    await seedLeaderboardCompetitors();

    // 3. Seed whale feed
    await seedWhaleFeed();

    // 4. Seed sample transactions
    await seedSampleTransactions();

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

    const userCount = await User.countDocuments();
    const feedCount = await WhaleFeed.countDocuments();
    const txCount = await Transaction.countDocuments();

    console.log(`
┌─────────────────────────────────────────────────────────┐
│  DATABASE SEEDED                                        │
├─────────────────────────────────────────────────────────┤
│  Users (Competitors):  ${String(userCount).padEnd(32)}│
│  Whale Feed Events:    ${String(feedCount).padEnd(32)}│
│  Transactions:         ${String(txCount).padEnd(32)}│
├─────────────────────────────────────────────────────────┤
│  YOUR WALLET: NOT SEEDED (start fresh!)                 │
│                                                         │
│  When you connect, you'll be a NEW user with:           │
│  - 0 points                                             │
│  - 0 streak                                             │
│  - No badge                                             │
│                                                         │
│  Do activities to earn points and climb leaderboard!    │
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
