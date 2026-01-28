/**
 * Seed Script: Create test user with complete data
 *
 * Run with: npx tsx scripts/seed-user.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whale-suite';

// Test wallet address - update this to your wallet
const TARGET_WALLET = 'FKQ1nEazoN9SiEy5xRC4FrskjT3B3usdB74sC9sUYq7';
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

const CardOrderSchema = new mongoose.Schema({
  wallet: { type: String, required: true, lowercase: true },
  orderId: { type: String, required: true },
  network: { type: String, enum: ['mainnet', 'devnet'], required: true, default: 'mainnet' },
  cardType: { type: String, enum: ['visa', 'mastercard'] },
  amount: Number,
  txSignature: String,
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
    badgePurchase: { tier: String, amount: Number, commission: Number, date: Date },
    subscriptions: [{ months: Number, amount: Number, commission: Number, date: Date }],
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  referredAt: { type: Date, default: Date.now },
  lastEarningAt: Date,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const CardOrder = mongoose.models.CardOrder || mongoose.model('CardOrder', CardOrderSchema);
const Badge = mongoose.models.Badge || mongoose.model('Badge', BadgeSchema);
const Referral = mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);

// ============ HELPERS ============

function generateSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  return Array.from({ length: 88 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function generateMintAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  return Array.from({ length: 44 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function generateOrderId(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

async function seedUser() {
  log('👤', 'Creating user...');

  const premiumExpiry = new Date();
  premiumExpiry.setDate(premiumExpiry.getDate() + 342);
  const badgePurchasedAt = daysAgo(23);

  let user = await User.findOne({ wallet: TARGET_WALLET });

  const userData = {
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
    settings: { notifications: true, emailUpdates: false, language: 'en', theme: 'dark' },
    lastLoginAt: new Date(),
  };

  if (user) {
    Object.assign(user, userData);
    await user.save();
  } else {
    user = await User.create(userData);
  }

  log('✅', `User #${user.userNumber} created`);
  return user;
}

async function seedBadge(user: typeof User.prototype) {
  log('🏅', 'Creating badge...');

  await Badge.deleteMany({ wallet: TARGET_WALLET });

  const badge = await Badge.create({
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
      attributes: { tier: 'Gold', userNumber: 999, privacyScoreBoost: '+50%', commissionRate: '15%' },
    },
    purchasedAt: user.badgePurchasedAt,
  });

  log('✅', `Badge created: ${badge.tier}`);
  return badge;
}

async function seedTransactions(user: typeof User.prototype) {
  log('💸', 'Creating transactions...');

  await Transaction.deleteMany({ wallet: TARGET_WALLET });

  const txConfigs = [
    // Recent activity (last 24 hours)
    { type: 'privacy_deposit', sdk: 'privacy-cash', amount: 150, hoursAgo: 2 },
    { type: 'shadow_transfer', sdk: 'shadow-wire', amount: 25, hoursAgo: 5 },
    { type: 'jupiter_swap', sdk: 'jupiter', amount: 100, hoursAgo: 8 },
    { type: 'card_order', amount: 50, hoursAgo: 12 },
    { type: 'pnp_bet', sdk: 'pnp', amount: 10, hoursAgo: 18 },

    // Yesterday
    { type: 'privacy_withdraw', sdk: 'privacy-cash', amount: 75, hoursAgo: 28 },
    { type: 'shadow_transfer', sdk: 'shadow-wire', amount: 200, hoursAgo: 36 },

    // Last week
    { type: 'jupiter_swap', sdk: 'jupiter', amount: 500, hoursAgo: 72 },
    { type: 'card_order', amount: 100, hoursAgo: 96 },
    { type: 'privacy_deposit', sdk: 'privacy-cash', amount: 300, hoursAgo: 120 },
    { type: 'pnp_bet', sdk: 'pnp', amount: 50, hoursAgo: 144 },
    { type: 'badge_purchase', amount: 5, hoursAgo: 552 }, // 23 days ago

    // Older transactions
    { type: 'privacy_deposit', sdk: 'privacy-cash', amount: 500, hoursAgo: 240 },
    { type: 'shadow_transfer', sdk: 'shadow-wire', amount: 150, hoursAgo: 336 },
    { type: 'jupiter_swap', sdk: 'jupiter', amount: 250, hoursAgo: 480 },
  ];

  const transactions = txConfigs.map(tx => {
    const createdAt = hoursAgo(tx.hoursAgo);
    return {
      userId: user._id,
      wallet: TARGET_WALLET,
      network: NETWORK,
      type: tx.type,
      amount: tx.amount,
      token: 'SOL',
      fee: 0.000005,
      sdk: tx.sdk,
      signature: generateSignature(),
      slot: 250000000 + Math.floor(Math.random() * 1000000),
      blockTime: Math.floor(createdAt.getTime() / 1000),
      status: 'confirmed',
      createdAt,
      confirmedAt: createdAt,
    };
  });

  await Transaction.insertMany(transactions);

  // Summary by type
  const summary = txConfigs.reduce((acc, tx) => {
    acc[tx.type] = (acc[tx.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  log('✅', `Created ${transactions.length} transactions`);
  logTable('Transaction Summary', Object.entries(summary).map(([type, count]) => ({ Type: type, Count: count })));

  return transactions;
}

async function seedCardOrders(user: typeof User.prototype) {
  log('💳', 'Creating card orders...');

  await CardOrder.deleteMany({ wallet: TARGET_WALLET.toLowerCase() });

  const orders = [
    { cardType: 'mastercard', amount: 50, hoursAgo: 12, txSignature: generateSignature() },
    { cardType: 'visa', amount: 100, hoursAgo: 96 },
    { cardType: 'mastercard', amount: 25, hoursAgo: 240 },
  ];

  const cardOrders = orders.map(o => ({
    wallet: TARGET_WALLET.toLowerCase(),
    orderId: generateOrderId(),
    network: NETWORK,
    cardType: o.cardType,
    amount: o.amount,
    txSignature: o.txSignature,
    createdAt: hoursAgo(o.hoursAgo),
  }));

  await CardOrder.insertMany(cardOrders);

  log('✅', `Created ${cardOrders.length} card orders`);
  logTable('Card Orders', cardOrders.map(o => ({
    OrderID: o.orderId.slice(0, 16) + '...',
    Type: o.cardType,
    Amount: `$${o.amount}`,
    Paid: o.txSignature ? 'Yes' : 'No'
  })));

  return cardOrders;
}

async function seedReferrals(user: typeof User.prototype) {
  log('🔗', 'Creating referrals...');

  await Referral.deleteMany({ referrerWallet: TARGET_WALLET });
  await User.deleteMany({ referredBy: TARGET_WALLET });

  const referredUsers = [];
  for (let i = 0; i < 5; i++) {
    const refUser = await User.create({
      wallet: generateMintAddress(),
      userNumber: 1000 + i,
      badgeTier: i < 2 ? 'bronze' : 'none',
      isPremium: i < 3,
      premiumExpiry: i < 3 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      privacyScore: Math.floor(Math.random() * 300),
      referralCode: `WHALE${1000 + i}`,
      referredBy: TARGET_WALLET,
    });
    referredUsers.push(refUser);
  }

  const referrals = referredUsers.map((refUser, i) => {
    const referredAt = daysAgo(Math.floor(Math.random() * 20) + 5);
    const hasBadge = i < 2;
    const commission = hasBadge ? 0.5 * 0.15 : 0;

    return {
      referrerId: user._id,
      referrerWallet: TARGET_WALLET,
      referredUserId: refUser._id,
      referredUserWallet: refUser.wallet,
      commissionRate: 15,
      totalEarned: commission,
      pendingPayout: i === 0 ? commission : 0,
      paidOut: i === 1 ? commission : 0,
      conversions: hasBadge ? {
        badgePurchase: { tier: 'bronze', amount: 0.5, commission, date: referredAt },
        subscriptions: [],
      } : { subscriptions: [] },
      status: 'active',
      referredAt,
      lastEarningAt: hasBadge ? referredAt : undefined,
    };
  });

  await Referral.insertMany(referrals);

  log('✅', `Created ${referrals.length} referrals`);
  logTable('Referrals', referrals.map((r, i) => ({
    User: `User #${1000 + i}`,
    Badge: i < 2 ? 'Bronze' : '-',
    Earned: `${r.totalEarned.toFixed(3)} SOL`,
    Status: r.pendingPayout > 0 ? 'Pending' : r.paidOut > 0 ? 'Paid' : 'Active'
  })));

  return referrals;
}

// ============ MAIN ============

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🐋 WHALE SUITE - DATABASE SEED SCRIPT');
  console.log('='.repeat(60) + '\n');

  console.log(`📌 Target Wallet: ${TARGET_WALLET}`);
  console.log(`📌 Network: ${NETWORK}\n`);

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!\n');

  try {
    // Seed data
    const user = await seedUser();
    await seedBadge(user);
    await seedTransactions(user);
    await seedCardOrders(user);
    await seedReferrals(user);

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

    console.log(`
┌─────────────────────────────────────────────────────────┐
│  USER SUMMARY                                           │
├─────────────────────────────────────────────────────────┤
│  Wallet:        ${TARGET_WALLET.slice(0, 20)}...    │
│  User #:        999                                     │
│  Badge:         Gold Phantom                            │
│  Privacy Score: 750                                     │
│  Premium:       342 days remaining                      │
│  Referral Code: WHALE999                                │
├─────────────────────────────────────────────────────────┤
│  ACTIVITY STATS                                         │
├─────────────────────────────────────────────────────────┤
│  Transactions:  15                                      │
│  Card Orders:   3                                       │
│  Referrals:     5                                       │
│  Hidden Balance: 850 SOL                                │
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
