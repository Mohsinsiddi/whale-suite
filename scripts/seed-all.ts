/**
 * Complete Database Reset & Seed Script
 *
 * Run with: npx tsx scripts/seed-all.ts
 *
 * This will:
 * 1. Drop all collections
 * 2. Create indexes for fast queries
 * 3. Seed users, transactions, points history
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
const TOKENS = ['SOL', 'USDC', 'USDT', 'BONK', 'JTO', 'WIF'];

// Schemas (inline to avoid import issues)
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
  action: { type: String, required: true },
  basePoints: { type: Number, required: true },
  multiplier: { type: Number, default: 1.0 },
  totalPoints: { type: Number, required: true },
  badgeTier: { type: String, default: 'none' },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });

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
  const collections = ['users', 'transactions', 'pointshistories', 'referrals', 'cardorders', 'whalefeeds'];
  for (const col of collections) {
    try {
      await db.dropCollection(col);
      console.log(`   Dropped: ${col}`);
    } catch (e) {
      // Collection might not exist
    }
  }
  console.log('');

  // Create models
  const User = mongoose.model('User', UserSchema);
  const Transaction = mongoose.model('Transaction', TransactionSchema);
  const PointsHistory = mongoose.model('PointsHistory', PointsHistorySchema);

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
  console.log('');

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

    users.push({
      wallet,
      userNumber: i,
      badgeTier,
      isPremium: badgeTier !== 'none',
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

  // Generate transactions
  console.log('💳 Generating transactions...');
  const allTransactions: any[] = [];
  const allPointsHistory: any[] = [];

  const sdkMap: Record<string, string> = {
    privacy_deposit: 'privacy-cash',
    privacy_withdraw: 'privacy-cash',
    shadow_transfer: 'shadow-wire',
    jupiter_swap: 'jupiter',
    pnp_bet: 'pnp',
  };

  const pointsMap: Record<string, number> = {
    privacy_deposit: 10,
    privacy_withdraw: 5,
    shadow_transfer: 25,
    jupiter_swap: 5,
    pnp_bet: 15,
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
      const metadata: Record<string, any> = {};
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
      const multiplier = user.badgeTier === 'none' ? 1 :
        user.badgeTier === 'bronze' ? 1.25 :
        user.badgeTier === 'silver' ? 1.5 :
        user.badgeTier === 'gold' ? 1.75 :
        user.badgeTier === 'diamond' ? 2.0 : 2.5;

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

  // Summary
  console.log('📊 Database Summary:');
  console.log(`   Users: ${await User.countDocuments()}`);
  console.log(`   Transactions: ${await Transaction.countDocuments()}`);
  console.log(`   Points History: ${await PointsHistory.countDocuments()}`);

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

  console.log('\n✅ Database seeding completed!');
  await mongoose.disconnect();
}

seedDatabase().catch(console.error);
