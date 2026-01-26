/**
 * Seed Script: Create test user for development
 *
 * Run with: npx tsx scripts/seed-user.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whale-suite';
const TARGET_WALLET = 'FKQ1nEazoN9SiEy5xRC4FrskjT3B3usdB74sC9sUYq7';

// User schema inline (to avoid import issues)
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

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Transaction schema
const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wallet: { type: String, required: true },
  type: {
    type: String,
    enum: ['privacy_deposit', 'privacy_withdraw', 'shadow_transfer', 'pnp_bet',
           'jupiter_swap', 'badge_purchase', 'subscription_payment', 'referral_payout'],
    required: true
  },
  amount: { type: Number, required: true },
  token: String,
  fee: Number,
  sdk: { type: String, enum: ['privacy-cash', 'shadow-wire', 'pnp', 'jupiter'] },
  signature: { type: String, required: true, unique: true },
  slot: Number,
  blockTime: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  errorMessage: String,
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  confirmedAt: Date,
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

// Referral schema
const ReferralSchema = new mongoose.Schema({
  referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referrerWallet: { type: String, required: true },
  referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referredUserWallet: { type: String, required: true },
  commissionRate: { type: Number, required: true },
  totalEarned: { type: Number, default: 0 },
  pendingPayout: { type: Number, default: 0 },
  paidOut: { type: Number, default: 0 },
  conversions: {
    badgePurchase: {
      tier: String,
      amount: Number,
      commission: Number,
      date: Date,
    },
    subscriptions: [{
      months: Number,
      amount: Number,
      commission: Number,
      date: Date,
    }],
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  referredAt: { type: Date, default: Date.now },
  lastEarningAt: Date,
}, { timestamps: true });

const Referral = mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);

// Badge schema
const BadgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wallet: { type: String, required: true },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'diamond', 'legendary'],
    required: true
  },
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

const Badge = mongoose.models.Badge || mongoose.model('Badge', BadgeSchema);

function generateSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 88; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateMintAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function seedUser() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  try {
    // Check if user already exists
    let user = await User.findOne({ wallet: TARGET_WALLET });

    // Calculate premium expiry (342 days from now)
    const premiumExpiry = new Date();
    premiumExpiry.setDate(premiumExpiry.getDate() + 342);

    const badgePurchasedAt = new Date();
    badgePurchasedAt.setDate(badgePurchasedAt.getDate() - 23); // 23 days ago

    if (user) {
      console.log('User exists, updating...');
      user.userNumber = 999;
      user.badgeTier = 'gold';
      user.badgeMint = generateMintAddress();
      user.badgePurchasedAt = badgePurchasedAt;
      user.isPremium = true;
      user.premiumExpiry = premiumExpiry;
      user.privacyScore = 750;
      user.stats = {
        hiddenBalance: 850,
        privateTransfers: 42,
        anonymousBets: 15,
        swapVolume: 125000,
        activeDays: 23,
      };
      user.referralCode = 'WHALE999';
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      console.log('Creating new user...');
      user = await User.create({
        wallet: TARGET_WALLET,
        userNumber: 999,
        badgeTier: 'gold',
        badgeMint: generateMintAddress(),
        badgePurchasedAt,
        isPremium: true,
        premiumExpiry,
        privacyScore: 750,
        stats: {
          hiddenBalance: 850,
          privateTransfers: 42,
          anonymousBets: 15,
          swapVolume: 125000,
          activeDays: 23,
        },
        referralCode: 'WHALE999',
        settings: {
          notifications: true,
          emailUpdates: false,
          language: 'en',
          theme: 'dark',
        },
        lastLoginAt: new Date(),
      });
    }

    console.log('User created/updated:', user.wallet, 'User #', user.userNumber);

    // Create badge for user
    const existingBadge = await Badge.findOne({ wallet: TARGET_WALLET });
    if (!existingBadge) {
      await Badge.create({
        userId: user._id,
        wallet: TARGET_WALLET,
        tier: 'gold',
        mintAddress: user.badgeMint,
        purchasePrice: 5,
        txSignature: generateSignature(),
        status: 'active',
        metadata: {
          name: 'Whale Suite - Gold Phantom',
          image: 'https://whale-suite.com/nft/gold.png',
          attributes: {
            tier: 'Gold',
            userNumber: 999,
            privacyScoreBoost: '+50%',
            commissionRate: '15%',
          },
        },
        purchasedAt: badgePurchasedAt,
      });
      console.log('Badge created for user');
    }

    // Create sample transactions
    const existingTxCount = await Transaction.countDocuments({ wallet: TARGET_WALLET });
    if (existingTxCount < 10) {
      console.log('Creating sample transactions...');

      const txTypes: Array<{ type: string; sdk?: string }> = [
        { type: 'privacy_deposit', sdk: 'privacy-cash' },
        { type: 'privacy_withdraw', sdk: 'privacy-cash' },
        { type: 'shadow_transfer', sdk: 'shadow-wire' },
        { type: 'jupiter_swap', sdk: 'jupiter' },
        { type: 'pnp_bet', sdk: 'pnp' },
      ];

      const transactions = [];
      for (let i = 0; i < 20; i++) {
        const txType = txTypes[Math.floor(Math.random() * txTypes.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        transactions.push({
          userId: user._id,
          wallet: TARGET_WALLET,
          type: txType.type,
          amount: Math.floor(Math.random() * 100) + 1,
          token: 'SOL',
          fee: 0.000005,
          sdk: txType.sdk,
          signature: generateSignature(),
          slot: 250000000 + Math.floor(Math.random() * 1000000),
          blockTime: Math.floor(createdAt.getTime() / 1000),
          status: 'confirmed',
          createdAt,
          confirmedAt: createdAt,
        });
      }

      await Transaction.insertMany(transactions);
      console.log(`Created ${transactions.length} transactions`);
    }

    // Create sample referrals
    const existingReferrals = await Referral.countDocuments({ referrerWallet: TARGET_WALLET });
    if (existingReferrals < 5) {
      console.log('Creating sample referrals...');

      // Create some referred users first
      const referredUsers = [];
      for (let i = 0; i < 7; i++) {
        const refWallet = generateMintAddress();
        const refUser = await User.create({
          wallet: refWallet,
          userNumber: 1000 + i,
          badgeTier: i < 3 ? 'bronze' : 'none',
          isPremium: i < 5,
          premiumExpiry: i < 5 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
          privacyScore: Math.floor(Math.random() * 300),
          referralCode: `WHALE${1000 + i}`,
          referredBy: TARGET_WALLET,
        });
        referredUsers.push(refUser);
      }

      // Create referrals
      const referrals = referredUsers.map((refUser, i) => {
        const daysAgo = Math.floor(Math.random() * 20) + 5;
        const referredAt = new Date();
        referredAt.setDate(referredAt.getDate() - daysAgo);

        const hasBadgePurchase = i < 3;
        const commission = hasBadgePurchase ? (0.5 * 0.15) : 0;

        return {
          referrerId: user._id,
          referrerWallet: TARGET_WALLET,
          referredUserId: refUser._id,
          referredUserWallet: refUser.wallet,
          commissionRate: 15,
          totalEarned: commission,
          pendingPayout: i < 2 ? commission : 0,
          paidOut: i >= 2 ? commission : 0,
          conversions: hasBadgePurchase ? {
            badgePurchase: {
              tier: 'bronze',
              amount: 0.5,
              commission,
              date: referredAt,
            },
            subscriptions: [],
          } : { subscriptions: [] },
          status: 'active',
          referredAt,
          lastEarningAt: hasBadgePurchase ? referredAt : undefined,
        };
      });

      await Referral.insertMany(referrals);
      console.log(`Created ${referrals.length} referrals`);
    }

    console.log('\n✅ User seed completed successfully!');
    console.log('-----------------------------------');
    console.log('Wallet:', TARGET_WALLET);
    console.log('User #:', 999);
    console.log('Badge Tier:', 'Gold');
    console.log('Privacy Score:', 750);
    console.log('Premium Days Left:', 342);
    console.log('Referral Code:', 'WHALE999');

  } catch (error) {
    console.error('Error seeding user:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedUser().catch(console.error);
