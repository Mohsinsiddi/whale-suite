/**
 * Seed Script: Generate 10,000 whale feed events
 *
 * Run with: npx tsx scripts/seed-whales.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whale-suite';
const TOTAL_EVENTS = 10000;
const BATCH_SIZE = 1000;

// WhaleFeed schema inline
const WhaleFeedSchema = new mongoose.Schema({
  whaleId: { type: String, required: true, index: true },
  walletHash: { type: String, required: true },
  eventType: {
    type: String,
    enum: ['large_transfer', 'privacy_deposit', 'privacy_withdraw', 'token_swap', 'anonymous_bet'],
    required: true
  },
  amount: Number,
  token: { type: String, default: 'SOL' },
  usdValue: Number,
  signature: { type: String, required: true, unique: true },
  slot: Number,
  blockTime: { type: Number, required: true },
  displayText: { type: String, required: true },
}, { timestamps: true });

const WhaleFeed = mongoose.models.WhaleFeed || mongoose.model('WhaleFeed', WhaleFeedSchema);

// Event type configurations
const EVENT_TYPES = [
  { type: 'large_transfer', weight: 35, minAmount: 100, maxAmount: 10000 },
  { type: 'privacy_deposit', weight: 25, minAmount: 50, maxAmount: 5000 },
  { type: 'privacy_withdraw', weight: 15, minAmount: 50, maxAmount: 3000 },
  { type: 'token_swap', weight: 15, minAmount: 100, maxAmount: 8000 },
  { type: 'anonymous_bet', weight: 10, minAmount: 10, maxAmount: 1000 },
];

// Tokens
const TOKENS = ['SOL', 'USDC', 'USDT', 'BONK', 'JTO', 'WIF', 'PYTH'];

// Generate random whale ID (e.g., "Whale #A34F")
function generateWhaleId(): string {
  const chars = '0123456789ABCDEF';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Whale #${id}`;
}

// Generate random signature
function generateSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 88; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate wallet hash
function generateWalletHash(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Select event type based on weights
function selectEventType(): typeof EVENT_TYPES[0] {
  const totalWeight = EVENT_TYPES.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const eventType of EVENT_TYPES) {
    random -= eventType.weight;
    if (random <= 0) {
      return eventType;
    }
  }

  return EVENT_TYPES[0];
}

// Generate display text for event
function generateDisplayText(
  whaleId: string,
  eventType: string,
  amount: number,
  token: string
): string {
  const formattedAmount = amount >= 1000
    ? `${(amount / 1000).toFixed(1)}K`
    : amount.toFixed(0);

  switch (eventType) {
    case 'large_transfer':
      return `${whaleId} transferred ${formattedAmount} ${token}`;
    case 'privacy_deposit':
      return `${whaleId} deposited ${formattedAmount} ${token} to shadow vault`;
    case 'privacy_withdraw':
      return `${whaleId} withdrew ${formattedAmount} ${token} from shadow vault`;
    case 'token_swap':
      const toToken = TOKENS[Math.floor(Math.random() * TOKENS.length)];
      return `${whaleId} swapped ${formattedAmount} ${token} to ${toToken}`;
    case 'anonymous_bet':
      return `${whaleId} placed ${formattedAmount} ${token} anonymous bet`;
    default:
      return `${whaleId} performed ${eventType} with ${formattedAmount} ${token}`;
  }
}

// Generate random amount with realistic distribution
function generateAmount(min: number, max: number): number {
  // Use exponential distribution for more realistic whale activity
  // Most transactions are smaller, few are very large
  const range = max - min;
  const random = Math.random();
  // Power curve: more small amounts, fewer large amounts
  const scaled = Math.pow(random, 0.5) * range;
  return Math.round((min + scaled) * 100) / 100;
}

async function seedWhales() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  try {
    // Check existing count
    const existingCount = await WhaleFeed.countDocuments();
    console.log(`Existing events: ${existingCount}`);

    if (existingCount >= TOTAL_EVENTS) {
      console.log('Already have enough events, skipping...');
      return;
    }

    const eventsToCreate = TOTAL_EVENTS - existingCount;
    console.log(`Creating ${eventsToCreate} whale feed events...`);

    // Generate events
    const events = [];
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // Create a pool of whale IDs for consistency
    const whalePool: Array<{ id: string; hash: string }> = [];
    for (let i = 0; i < 500; i++) {
      whalePool.push({
        id: generateWhaleId(),
        hash: generateWalletHash(),
      });
    }

    for (let i = 0; i < eventsToCreate; i++) {
      const eventConfig = selectEventType();
      const whale = whalePool[Math.floor(Math.random() * whalePool.length)];

      // Random time in last 30 days, with more recent events being more likely
      const timeAgo = Math.pow(Math.random(), 1.5) * thirtyDaysMs;
      const blockTime = Math.floor((now - timeAgo) / 1000);

      const token = eventConfig.type === 'token_swap' || eventConfig.type === 'anonymous_bet'
        ? TOKENS[Math.floor(Math.random() * TOKENS.length)]
        : Math.random() > 0.3 ? 'SOL' : TOKENS[Math.floor(Math.random() * TOKENS.length)];

      const amount = generateAmount(eventConfig.minAmount, eventConfig.maxAmount);

      // Calculate USD value (mock prices)
      const prices: Record<string, number> = {
        SOL: 150,
        USDC: 1,
        USDT: 1,
        BONK: 0.00001,
        JTO: 2.5,
        WIF: 1.8,
        PYTH: 0.35,
      };
      const usdValue = amount * (prices[token] || 1);

      events.push({
        whaleId: whale.id,
        walletHash: whale.hash,
        eventType: eventConfig.type,
        amount,
        token,
        usdValue: Math.round(usdValue * 100) / 100,
        signature: generateSignature(),
        slot: 250000000 + Math.floor(Math.random() * 5000000),
        blockTime,
        displayText: generateDisplayText(whale.id, eventConfig.type, amount, token),
        createdAt: new Date(blockTime * 1000),
      });

      // Insert in batches
      if (events.length >= BATCH_SIZE) {
        await WhaleFeed.insertMany(events, { ordered: false }).catch((err) => {
          // Ignore duplicate key errors
          if (err.code !== 11000) {
            console.error('Batch insert error:', err.message);
          }
        });
        console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
        events.length = 0;
      }
    }

    // Insert remaining events
    if (events.length > 0) {
      await WhaleFeed.insertMany(events, { ordered: false }).catch((err) => {
        if (err.code !== 11000) {
          console.error('Final batch insert error:', err.message);
        }
      });
    }

    const finalCount = await WhaleFeed.countDocuments();
    console.log(`\n✅ Whale feed seeding completed!`);
    console.log(`Total events in database: ${finalCount}`);

    // Show sample distribution
    console.log('\nEvent type distribution:');
    for (const eventType of EVENT_TYPES) {
      const count = await WhaleFeed.countDocuments({ eventType: eventType.type });
      const percentage = ((count / finalCount) * 100).toFixed(1);
      console.log(`  ${eventType.type}: ${count} (${percentage}%)`);
    }

  } catch (error) {
    console.error('Error seeding whales:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedWhales().catch(console.error);
