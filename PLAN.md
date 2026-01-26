# 🐋 WHALE SUITE - COMPLETE SYSTEM PLAN

> Privacy-First Trading Platform with Stealth Wallets & Whale Intelligence

---

## 📑 TABLE OF CONTENTS

1. [Branding & Naming](#branding--naming)
2. [Pages & Routes](#pages--routes)
3. [Database Schema](#database-schema)
4. [Stealth Wallet System](#stealth-wallet-system)
5. [Whale Intelligence Engine](#whale-intelligence-engine)
6. [P&L Tracking System](#pnl-tracking-system)
7. [Implementation Order](#implementation-order)

---

## 🎨 BRANDING & NAMING

### Core Brand
```
Platform Name: WHALE SUITE
Tagline: "Trade in Shadows. Profit in Silence."
```

### Stealth Mode Naming System

| Feature | Name | Description |
|---------|------|-------------|
| Stealth Wallets | **Shadow Vaults** | PDA-based sub-wallets |
| Main Wallet | **Command Center** | Primary wallet that controls vaults |
| Private Balance | **Dark Pool** | Hidden balance in Privacy Cash |
| Anonymous Transfer | **Ghost Send** | ShadowWire transfers |
| Whale Identity | **Phantom ID** | Anonymous whale identifier (e.g., `Phantom #7X9K`) |
| Privacy Score | **Stealth Rating** | 0-1000 invisibility score |
| Premium Mode | **Shadow Protocol** | Premium subscription |
| Badge Tiers | **Phantom Ranks** | Bronze Ghost → Legendary Titan |

### Vault Naming Convention
Users can name their Shadow Vaults:
- `Trading Alpha` - For active trading
- `Cold Storage` - Long-term holdings
- `DeFi Ops` - Yield farming
- `NFT Treasury` - NFT operations
- Custom names allowed

---

## 📄 PAGES & ROUTES

### Public Pages (No Auth Required)

#### 1. **Landing Page** `/`
```
Purpose: Convert visitors to users
Sections:
- Hero: "Trade Like a Ghost" + Connect Wallet CTA
- Features grid (6 core features)
- How it works (3 steps)
- Badge tiers preview
- Whale feed preview (teaser)
- Testimonials (anonymous)
- FAQ accordion
- Footer with socials

Mobile: Single column, stacked sections
Desktop: Full-width hero, 2-3 column grids
```

#### 2. **Documentation** `/docs`
```
Purpose: Help users understand the platform
Sub-pages:
- /docs/getting-started
- /docs/shadow-vaults
- /docs/privacy-tools
- /docs/whale-intelligence
- /docs/badges
- /docs/affiliate
- /docs/api (for developers)
- /docs/faq

Features:
- Sidebar navigation
- Search functionality
- Code examples
- Video embeds
```

### Auth Pages

#### 3. **Connect Wallet** `/connect`
```
Purpose: Onboard users via Privy
Flow:
1. Show wallet options (Phantom, Solflare, Email, Social)
2. Connect via Privy
3. Check if registered:
   - YES → Redirect to /dashboard
   - NO → Redirect to /onboarding
```

#### 4. **Onboarding** `/onboarding`
```
Purpose: First-time user setup
Steps:
1. Welcome screen with platform intro
2. Create first Shadow Vault (optional)
3. Set notification preferences
4. Show referral code input (optional)
5. Tutorial overlay option
6. Redirect to /dashboard

Data Collected:
- Referral code (if any)
- First vault name (optional)
- Notification settings
```

### Dashboard Pages (Auth Required)

#### 5. **Main Dashboard** `/dashboard`
```
Purpose: Command center overview
Components:
┌─────────────────────────────────────────────────────┐
│  STEALTH RATING: 847/1000  [████████░░] 84.7%       │
├─────────────────────────────────────────────────────┤
│  COMMAND CENTER                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │ Public      │ │ Dark Pool   │ │ Total       │    │
│  │ 124.5 SOL   │ │ 500.0 SOL   │ │ 624.5 SOL   │    │
│  │ $18,675     │ │ $75,000     │ │ $93,675     │    │
│  └─────────────┘ └─────────────┘ └─────────────┘    │
├─────────────────────────────────────────────────────┤
│  SHADOW VAULTS (3)                    [+ New Vault] │
│  ┌─────────────────────────────────────────────────┐│
│  │ 🔒 Trading Alpha    │ 45.2 SOL  │ Active │ →   ││
│  │ 🔒 Cold Storage     │ 200 SOL   │ Idle   │ →   ││
│  │ 🔒 DeFi Ops         │ 12.8 SOL  │ Active │ →   ││
│  └─────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│  QUICK ACTIONS                                       │
│  [Deposit] [Ghost Send] [Swap] [Bet]                │
├─────────────────────────────────────────────────────┤
│  24H P&L: +12.5 SOL (+$1,875)  ▲ 5.2%              │
├─────────────────────────────────────────────────────┤
│  WHALE INTELLIGENCE FEED                             │
│  • Phantom #A3X9 deposited 5,000 SOL to Dark Pool   │
│  • Phantom #K7Y2 swapped 10K USDC → SOL             │
│  • Large accumulation detected: JUP token           │
└─────────────────────────────────────────────────────┘

Data Displayed:
- Stealth Rating (privacy score)
- Public balance (visible on-chain)
- Dark Pool balance (hidden in Privacy Cash)
- Total portfolio value (USD)
- Shadow Vaults list with balances
- Quick action buttons
- 24h/7d/30d P&L
- Recent whale activity feed (5 items)
- Badge status (if any)
- Affiliate earnings preview
```

#### 6. **Shadow Vaults** `/vaults`
```
Purpose: Manage stealth wallets (PDAs)
Features:
- List all vaults with balances
- Create new vault (up to 10 per user)
- Rename vault
- View vault address (copyable)
- View vault transactions
- Transfer between vaults (internal)
- Transfer to external (Ghost Send)
- Deposit to vault from main wallet
- Withdraw to main wallet

Vault Card Display:
┌─────────────────────────────────────┐
│ 🔒 Trading Alpha                    │
│ Address: 7X9K...3F2M (copy)         │
│ Balance: 45.2 SOL ($6,780)          │
│ Dark Pool: 100 SOL ($15,000)        │
│ Last Activity: 2 hours ago          │
│ Status: ● Active                    │
│                                     │
│ [Deposit] [Send] [History]          │
└─────────────────────────────────────┘
```

#### 7. **Single Vault View** `/vaults/[vaultId]`
```
Purpose: Detailed vault management
Sections:
- Vault header (name, address, balance)
- P&L chart for this vault
- Transaction history
- Token holdings
- Privacy actions (deposit to dark pool)
- Settings (rename, close vault)
```

#### 8. **Ghost Send (Transfers)** `/transfer`
```
Purpose: Private transfers via ShadowWire
Types:
1. Internal Transfer (Vault → Vault)
   - Select source vault
   - Select destination vault
   - Amount (hidden on-chain)

2. Ghost Send (Anonymous External)
   - Select source vault
   - Enter recipient address
   - Amount
   - Sender identity hidden

3. Dark Pool Deposit
   - Select source vault
   - Amount to hide
   - Token selection

UI Flow:
1. Select transfer type (tabs)
2. Select source (vault dropdown)
3. Enter recipient/destination
4. Enter amount
5. Review fees
6. Confirm transaction
7. Progress modal (3 steps)
8. Success/Error result
```

#### 9. **Swap** `/swap`
```
Purpose: Token swaps via Jupiter
Features:
- Token input selector
- Token output selector
- Amount input
- Best route display
- Price impact warning
- Slippage settings
- Execute from any vault

Privacy Note Banner:
"⚠️ Swaps are public. Use a dedicated vault for trading."

UI:
┌─────────────────────────────────────┐
│ SWAP                    ⚙️ Settings │
├─────────────────────────────────────┤
│ From: [Trading Alpha ▼]             │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ SOL                    45.2 MAX │ │
│ │ [        10.00         ]        │ │
│ │                        $1,500   │ │
│ └─────────────────────────────────┘ │
│              ↓↑                      │
│ ┌─────────────────────────────────┐ │
│ │ USDC                            │ │
│ │ [       1,485.50       ]        │ │
│ │                        $1,485   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Rate: 1 SOL = 148.55 USDC           │
│ Price Impact: 0.05%                 │
│ Route: SOL → USDC (Raydium)         │
├─────────────────────────────────────┤
│ [          SWAP NOW          ]      │
└─────────────────────────────────────┘
```

#### 10. **Prediction Markets** `/markets`
```
Purpose: Anonymous betting via PNP
Features:
- Browse active markets
- Filter by category (Crypto, Sports, Politics)
- Place anonymous bets
- View positions
- Claim winnings
- Leaderboard (Phantom IDs only)

Market Card:
┌─────────────────────────────────────┐
│ Will SOL reach $200 by March?       │
│ Category: Crypto                    │
│ Ends: Mar 31, 2026                  │
│                                     │
│ YES: 65%  ████████░░░  NO: 35%     │
│ Pool: 5,420 SOL                     │
│                                     │
│ [Bet YES] [Bet NO]                  │
└─────────────────────────────────────┘

My Positions Tab:
- Active bets
- Claimable winnings
- Bet history
```

#### 11. **Whale Intelligence** `/intelligence`
```
Purpose: Track whale activity for alpha
Sections:

1. LIVE FEED
   - Real-time whale transactions
   - Filters: size, token, type
   - Phantom IDs (anonymized)

2. WHALE TRACKER
   - Follow specific Phantom IDs
   - Get alerts on their moves
   - See their P&L (estimated)

3. TOKEN ACCUMULATION
   - Tokens being accumulated by whales
   - Buy/sell pressure indicators
   - Volume analysis

4. SMART MONEY SIGNALS
   - AI-detected patterns
   - Entry/exit signals
   - Risk ratings

5. MY WATCHLIST
   - Saved Phantom IDs
   - Saved tokens
   - Custom alerts

Feed Item:
┌─────────────────────────────────────┐
│ 🐋 Phantom #A3X9           2m ago  │
│ Deposited 5,000 SOL to Dark Pool   │
│ Value: $750,000                     │
│ [Follow] [Alert]                    │
└─────────────────────────────────────┘

Accumulation Card:
┌─────────────────────────────────────┐
│ 🔥 JUP - Jupiter                    │
│ Whale Accumulation: HIGH            │
│ 24h Whale Buys: +2.4M JUP           │
│ 24h Whale Sells: -800K JUP          │
│ Net Flow: +1.6M JUP ($2.8M)         │
│ [Track Token] [Set Alert]           │
└─────────────────────────────────────┘
```

#### 12. **Portfolio & P&L** `/portfolio`
```
Purpose: Track performance across all vaults
Sections:

1. OVERVIEW
   - Total portfolio value
   - Total P&L (unrealized + realized)
   - ROI percentage
   - Time filters (24h, 7d, 30d, 90d, 1y, All)

2. P&L CHART
   - Line chart of portfolio value over time
   - Benchmark comparison (SOL, BTC)
   - Profit/loss zones highlighted

3. HOLDINGS BREAKDOWN
   - Pie chart by token
   - Table with: Token, Amount, Value, 24h%, Allocation%
   - Sort by value, gain, loss

4. VAULT PERFORMANCE
   - Compare P&L across vaults
   - Best/worst performing vault
   - Bar chart comparison

5. TRANSACTION HISTORY
   - All trades with P&L per trade
   - Filters: vault, token, date, type
   - Export to CSV

P&L Card:
┌─────────────────────────────────────┐
│ TOTAL P&L (30 Days)                 │
│ +$12,450.00  (+8.5%)   ▲            │
│                                     │
│ Realized:   +$5,200                 │
│ Unrealized: +$7,250                 │
│                                     │
│ Best Trade:  SOL/USDC  +$2,100      │
│ Worst Trade: JUP/SOL   -$340        │
└─────────────────────────────────────┘
```

#### 13. **Badges & Ranks** `/badges`
```
Purpose: Badge marketplace & display
Sections:

1. MY RANK
   - Current badge (if any)
   - Benefits unlocked
   - Upgrade path
   - Expiry date

2. BADGE MARKETPLACE
   - All 5 tiers displayed
   - Price, benefits, requirements
   - Purchase CTA
   - NFT preview

3. REQUIREMENTS CHECKER
   - Show user's progress toward each tier
   - Metrics needed vs current

Badge Card:
┌─────────────────────────────────────┐
│ 🥇 GOLD PHANTOM                     │
│ Price: 5 SOL ($750)                 │
├─────────────────────────────────────┤
│ Benefits:                           │
│ ✓ 1 year premium access             │
│ ✓ +50% stealth rating boost         │
│ ✓ 15% affiliate commission          │
│ ✓ Priority support                  │
│ ✓ Custom themes                     │
├─────────────────────────────────────┤
│ Requirements:         Your Progress │
│ Stealth Rating: 300   [██████░] 280│
│ Dark Pool: 200 SOL    [████████] ✓ │
│ Ghost Sends: 50       [███░░░░] 32 │
├─────────────────────────────────────┤
│ [Purchase Badge - 5 SOL]            │
└─────────────────────────────────────┘
```

#### 14. **Affiliate Center** `/affiliate`
```
Purpose: Manage referral program
Sections:

1. EARNINGS OVERVIEW
   - Total earned (all time)
   - Pending payout
   - Paid out
   - Commission rate (based on badge)

2. REFERRAL LINK
   - Unique code display
   - Copy link button
   - QR code
   - Share buttons (Twitter, Telegram, Discord)

3. REFERRAL LIST
   - Table: Phantom ID, Joined, Purchases, Commission, Status
   - Click to see details

4. PAYOUT HISTORY
   - Past payouts
   - Transaction signatures

5. LEADERBOARD
   - Top 20 affiliates
   - Your rank
   - Monthly prizes

Earnings Card:
┌─────────────────────────────────────┐
│ YOUR EARNINGS                       │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ Total   │ │ Pending │ │ Rate    ││
│ │12.5 SOL │ │ 2.3 SOL │ │ 15%     ││
│ │ $1,875  │ │ $345    │ │ (Gold)  ││
│ └─────────┘ └─────────┘ └─────────┘│
├─────────────────────────────────────┤
│ Your Link:                          │
│ whale-suite.com/?ref=PHANTOM999     │
│ [Copy] [QR] [Share ▼]               │
└─────────────────────────────────────┘
```

#### 15. **Profile & Settings** `/profile`
```
Purpose: User settings and identity
Tabs:

1. PROFILE
   - Phantom ID display
   - User number (#999)
   - Registration date
   - Badge display (NFT image)
   - Stealth rating breakdown
   - Stats summary

2. WALLETS
   - Connected wallets list
   - Add new wallet
   - Remove wallet
   - Set primary wallet

3. NOTIFICATIONS
   - Email preferences
   - Push notifications
   - Whale alerts settings
   - Transaction notifications

4. SECURITY
   - Export vault keys (with warnings)
   - Session management
   - 2FA settings (future)

5. APPEARANCE
   - Theme selection (dark/darker)
   - Language (EN, ES, CN)
   - Display currency (USD, EUR, SOL)

6. DATA
   - Export all data
   - Delete account (danger zone)
```

### Route Summary

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/` | Landing | No | Marketing page |
| `/docs` | Documentation | No | Help center |
| `/docs/[...slug]` | Doc Page | No | Individual doc |
| `/connect` | Connect Wallet | No | Privy auth |
| `/onboarding` | Onboarding | Yes | First-time setup |
| `/dashboard` | Dashboard | Yes | Main overview |
| `/vaults` | Shadow Vaults | Yes | Manage vaults |
| `/vaults/[id]` | Vault Detail | Yes | Single vault |
| `/transfer` | Ghost Send | Yes | Private transfers |
| `/swap` | Swap | Yes | Jupiter swaps |
| `/markets` | Markets | Yes | PNP betting |
| `/intelligence` | Whale Intel | Yes | Whale tracking |
| `/portfolio` | Portfolio | Yes | P&L tracking |
| `/badges` | Badges | Yes | NFT badges |
| `/affiliate` | Affiliate | Yes* | Referrals (*Premium only) |
| `/profile` | Profile | Yes | Settings |

---

## 🗄️ DATABASE SCHEMA

### Collection: `users`

```typescript
interface User {
  _id: ObjectId;

  // ===== IDENTITY =====
  wallet: string;                    // Primary Solana address (indexed, unique)
  privyId: string;                   // Privy user ID (indexed, unique)
  email?: string;                    // Optional email from Privy
  phantomId: string;                 // Generated: "PHANTOM#A3X9" (indexed, unique)
  userNumber: number;                // Sequential: #999 (indexed, unique)

  // ===== ON-CHAIN SYNC =====
  // These fields will be synced from smart contract when built
  onChainData: {
    userAccountPda?: string;         // PDA address when contract deployed
    registeredOnChain: boolean;      // True when contract registration done
    lastSyncedSlot?: number;         // Last synced blockchain slot
    lastSyncedAt?: Date;
  };

  // ===== BADGE & SUBSCRIPTION =====
  badge: {
    tier: 'none' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
    mintAddress?: string;            // NFT mint when contract deployed
    purchasedAt?: Date;
    expiresAt?: Date;                // Badge grants 1 year premium
    txSignature?: string;
  };

  subscription: {
    isPremium: boolean;
    premiumSince?: Date;
    premiumExpiry?: Date;
    source: 'trial' | 'badge' | 'subscription' | 'lifetime';
  };

  // ===== STEALTH RATING (Privacy Score) =====
  stealthRating: {
    score: number;                   // 0-1000
    lastCalculatedAt: Date;
    breakdown: {
      darkPoolBalance: number;       // Points from hidden balance
      ghostSendsCount: number;       // Points from private transfers
      vaultDiversity: number;        // Points from using multiple vaults
      activityPrivacy: number;       // Points from private vs public ratio
      holdingDuration: number;       // Points from long-term holding
    };
    rank?: number;                   // Global rank
    percentile?: number;             // Top X%
  };

  // ===== AGGREGATED STATS =====
  stats: {
    // Balances (updated periodically)
    totalPublicBalance: number;      // Sum of all vault public balances (SOL)
    totalDarkPoolBalance: number;    // Sum of all hidden balances (SOL)
    totalPortfolioUsd: number;       // Total in USD

    // Activity counts
    totalGhostSends: number;
    totalSwaps: number;
    totalBets: number;
    totalDeposits: number;
    totalWithdrawals: number;

    // P&L
    totalRealizedPnl: number;        // In USD
    totalUnrealizedPnl: number;      // In USD
    bestTrade: {
      token: string;
      pnl: number;
      date: Date;
    };
    worstTrade: {
      token: string;
      pnl: number;
      date: Date;
    };

    // Engagement
    activeDays: number;
    currentStreak: number;
    longestStreak: number;
    lastActiveAt: Date;
  };

  // ===== REFERRAL =====
  referral: {
    code: string;                    // Unique: "PHANTOM999" (indexed, unique)
    referredBy?: string;             // Referrer's wallet
    referredByCode?: string;         // Code used to join
    totalReferrals: number;
    totalEarned: number;             // In SOL
    pendingPayout: number;           // In SOL
    paidOut: number;                 // In SOL
    commissionRate: number;          // 0.05 to 0.25 based on badge
  };

  // ===== SETTINGS =====
  settings: {
    notifications: {
      email: boolean;
      push: boolean;
      whaleAlerts: boolean;
      transactionAlerts: boolean;
      marketingEmails: boolean;
    };
    display: {
      theme: 'dark' | 'darker';
      language: 'en' | 'es' | 'cn';
      currency: 'USD' | 'EUR' | 'SOL';
    };
    privacy: {
      showOnLeaderboard: boolean;
      allowAnalytics: boolean;
    };
  };

  // ===== METADATA =====
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  registrationIp?: string;           // For fraud detection
  userAgent?: string;
}

// INDEXES
// Primary
db.users.createIndex({ wallet: 1 }, { unique: true });
db.users.createIndex({ privyId: 1 }, { unique: true });
db.users.createIndex({ userNumber: 1 }, { unique: true });
db.users.createIndex({ phantomId: 1 }, { unique: true });
db.users.createIndex({ "referral.code": 1 }, { unique: true });

// Queries
db.users.createIndex({ "badge.tier": 1 });
db.users.createIndex({ "stealthRating.score": -1 });
db.users.createIndex({ "stats.totalPortfolioUsd": -1 });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ "referral.referredBy": 1 });
```

### Collection: `vaults` (Shadow Vaults)

```typescript
interface Vault {
  _id: ObjectId;

  // ===== OWNERSHIP =====
  userId: ObjectId;                  // Reference to users (indexed)
  userWallet: string;                // Owner's main wallet (indexed)

  // ===== IDENTITY =====
  vaultNumber: number;               // Per-user sequential: 1, 2, 3...
  name: string;                      // User-defined: "Trading Alpha"

  // ===== ADDRESSES =====
  // PDA derived from: [user_wallet, vault_number, "shadow-vault"]
  address: string;                   // PDA address (indexed, unique)
  pdaSeeds: {
    userWallet: string;
    vaultNumber: number;
    bump: number;
  };

  // ===== BALANCES =====
  balances: {
    // Native SOL
    sol: {
      public: number;                // Visible on-chain
      darkPool: number;              // Hidden in Privacy Cash
      total: number;                 // Computed
    };
    // Token balances
    tokens: Array<{
      mint: string;                  // Token mint address
      symbol: string;                // "USDC", "JUP", etc.
      public: number;
      darkPool: number;
      total: number;
      usdValue: number;
    }>;
    // Aggregate
    totalUsd: number;                // Total vault value in USD
  };

  // ===== ACTIVITY =====
  activity: {
    totalTransactions: number;
    lastTransactionAt?: Date;
    status: 'active' | 'idle' | 'dormant';  // Based on recent activity
    createdAt: Date;
  };

  // ===== P&L =====
  pnl: {
    realizedPnl: number;             // USD
    unrealizedPnl: number;           // USD
    totalPnl: number;                // Computed
    roi: number;                     // Percentage
    // Snapshots for charts
    snapshots: Array<{
      timestamp: Date;
      totalUsd: number;
    }>;
  };

  // ===== ON-CHAIN SYNC =====
  onChainData: {
    createdOnChain: boolean;         // True when PDA initialized
    creationTxSignature?: string;
    lastSyncedSlot?: number;
    lastSyncedAt?: Date;
  };

  // ===== METADATA =====
  isDefault: boolean;                // First vault is default
  isArchived: boolean;               // Soft delete
  createdAt: Date;
  updatedAt: Date;
}

// INDEXES
db.vaults.createIndex({ userId: 1, vaultNumber: 1 }, { unique: true });
db.vaults.createIndex({ userWallet: 1 });
db.vaults.createIndex({ address: 1 }, { unique: true });
db.vaults.createIndex({ "balances.totalUsd": -1 });
db.vaults.createIndex({ isArchived: 1 });
```

### Collection: `transactions`

```typescript
interface Transaction {
  _id: ObjectId;

  // ===== OWNERSHIP =====
  userId: ObjectId;                  // Reference to users
  vaultId: ObjectId;                 // Reference to vaults (source vault)
  vaultAddress: string;              // For quick lookup

  // ===== TYPE =====
  type:
    | 'deposit'                      // SOL into vault from external
    | 'withdrawal'                   // SOL out of vault to external
    | 'vault_transfer'               // Between own vaults
    | 'ghost_send'                   // ShadowWire external transfer
    | 'dark_pool_deposit'            // Into Privacy Cash
    | 'dark_pool_withdraw'           // Out of Privacy Cash
    | 'swap'                         // Jupiter swap
    | 'bet_place'                    // PNP bet placed
    | 'bet_claim'                    // PNP winnings claimed
    | 'badge_purchase'               // Badge NFT minted
    | 'subscription_payment';        // Monthly subscription

  // ===== DETAILS =====
  amount: number;                    // Primary amount
  token: {                           // Token involved
    mint: string;
    symbol: string;
    decimals: number;
  };
  secondaryAmount?: number;          // For swaps (output amount)
  secondaryToken?: {                 // For swaps (output token)
    mint: string;
    symbol: string;
    decimals: number;
  };
  usdValue: number;                  // USD value at time of tx

  // ===== PARTIES =====
  from: {
    address: string;                 // Source address
    type: 'vault' | 'external' | 'dark_pool';
  };
  to: {
    address: string;                 // Destination address
    type: 'vault' | 'external' | 'dark_pool';
  };

  // ===== P&L =====
  pnl?: {
    realized: number;                // USD
    costBasis: number;               // Original cost
    proceeds: number;                // Sale proceeds
  };

  // ===== ON-CHAIN =====
  onChain: {
    signature: string;               // Transaction signature (indexed)
    slot: number;
    blockTime: number;
    fee: number;                     // In lamports
    status: 'pending' | 'confirmed' | 'failed';
    errorMessage?: string;
  };

  // ===== PRIVACY =====
  privacy: {
    sdk?: 'privacy-cash' | 'shadow-wire' | 'pnp' | 'jupiter' | 'native';
    isPrivate: boolean;              // True if hidden on-chain
    privacyLevel: 'public' | 'amount_hidden' | 'sender_hidden' | 'full_privacy';
  };

  // ===== METADATA =====
  metadata: Record<string, any>;     // Flexible additional data
  note?: string;                     // User-added note
  createdAt: Date;
  confirmedAt?: Date;
}

// INDEXES
db.transactions.createIndex({ userId: 1, createdAt: -1 });
db.transactions.createIndex({ vaultId: 1, createdAt: -1 });
db.transactions.createIndex({ "onChain.signature": 1 }, { unique: true });
db.transactions.createIndex({ type: 1, createdAt: -1 });
db.transactions.createIndex({ "onChain.status": 1 });
db.transactions.createIndex({ createdAt: -1 });
```

### Collection: `portfolio_snapshots`

```typescript
interface PortfolioSnapshot {
  _id: ObjectId;

  userId: ObjectId;                  // Reference to users

  // ===== TIMING =====
  timestamp: Date;                   // When snapshot taken
  interval: 'hourly' | 'daily' | 'weekly';

  // ===== VALUES =====
  totalValueUsd: number;
  publicValueUsd: number;
  darkPoolValueUsd: number;

  // ===== BY VAULT =====
  vaults: Array<{
    vaultId: ObjectId;
    name: string;
    valueUsd: number;
  }>;

  // ===== BY TOKEN =====
  tokens: Array<{
    mint: string;
    symbol: string;
    amount: number;
    valueUsd: number;
    allocation: number;              // Percentage
  }>;

  // ===== P&L AT SNAPSHOT =====
  pnl: {
    daily: number;                   // 24h P&L
    weekly: number;                  // 7d P&L
    monthly: number;                 // 30d P&L
    allTime: number;
  };

  createdAt: Date;
}

// INDEXES
db.portfolio_snapshots.createIndex({ userId: 1, timestamp: -1 });
db.portfolio_snapshots.createIndex({ userId: 1, interval: 1, timestamp: -1 });
db.portfolio_snapshots.createIndex({ timestamp: -1 });
// TTL index - delete old hourly snapshots after 7 days
db.portfolio_snapshots.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 604800, partialFilterExpression: { interval: 'hourly' } }
);
```

### Collection: `whale_activity`

```typescript
interface WhaleActivity {
  _id: ObjectId;

  // ===== WHALE IDENTITY =====
  walletHash: string;                // Hashed wallet for tracking (indexed)
  phantomId: string;                 // Anonymous ID: "Phantom #A3X9" (indexed)

  // ===== EVENT =====
  eventType:
    | 'large_transfer'               // >100 SOL transfer
    | 'dark_pool_deposit'            // Privacy Cash deposit
    | 'dark_pool_withdraw'           // Privacy Cash withdraw
    | 'token_accumulation'           // Large token buy
    | 'token_distribution'           // Large token sell
    | 'swap'                         // Large swap
    | 'new_whale'                    // First large tx from wallet
    | 'whale_movement';              // Whale wallet transfer

  // ===== DETAILS =====
  amount: number;
  token: {
    mint: string;
    symbol: string;
  };
  usdValue: number;
  direction?: 'in' | 'out';

  // ===== DISPLAY =====
  displayText: string;               // "Phantom #A3X9 deposited 5K SOL"
  importance: 'low' | 'medium' | 'high' | 'critical';

  // ===== ON-CHAIN =====
  signature: string;
  slot: number;
  blockTime: number;

  // ===== SOURCE =====
  source: 'helius' | 'manual' | 'internal';

  createdAt: Date;
}

// INDEXES
db.whale_activity.createIndex({ createdAt: -1 });
db.whale_activity.createIndex({ phantomId: 1, createdAt: -1 });
db.whale_activity.createIndex({ eventType: 1, createdAt: -1 });
db.whale_activity.createIndex({ "token.symbol": 1, createdAt: -1 });
db.whale_activity.createIndex({ importance: 1, createdAt: -1 });
// TTL - keep 90 days
db.whale_activity.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
```

### Collection: `token_accumulation`

```typescript
interface TokenAccumulation {
  _id: ObjectId;

  // ===== TOKEN =====
  mint: string;                      // Token mint (indexed)
  symbol: string;
  name: string;

  // ===== ACCUMULATION DATA =====
  timeframe: '1h' | '24h' | '7d' | '30d';

  whaleActivity: {
    totalBuys: number;               // USD
    totalSells: number;              // USD
    netFlow: number;                 // Buys - Sells
    uniqueWhales: number;
    buyTransactions: number;
    sellTransactions: number;
  };

  // ===== SIGNALS =====
  signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  confidence: number;                // 0-100

  // ===== PRICE =====
  priceAtStart: number;
  priceAtEnd: number;
  priceChange: number;               // Percentage

  // ===== METADATA =====
  calculatedAt: Date;
  expiresAt: Date;                   // When this data is stale
}

// INDEXES
db.token_accumulation.createIndex({ mint: 1, timeframe: 1 });
db.token_accumulation.createIndex({ signal: 1, confidence: -1 });
db.token_accumulation.createIndex({ "whaleActivity.netFlow": -1 });
db.token_accumulation.createIndex({ calculatedAt: -1 });
```

### Collection: `badges`

```typescript
interface Badge {
  _id: ObjectId;

  // ===== OWNERSHIP =====
  userId: ObjectId;
  wallet: string;

  // ===== BADGE INFO =====
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  tierId: number;                    // 1-5
  name: string;                      // "Gold Phantom"

  // ===== NFT =====
  nft: {
    mintAddress?: string;            // When minted
    metadataUri: string;
    image: string;
    attributes: Array<{
      traitType: string;
      value: string | number;
    }>;
  };

  // ===== PURCHASE =====
  purchase: {
    priceSOL: number;
    priceUSD: number;
    txSignature?: string;
    purchasedAt?: Date;
  };

  // ===== STATUS =====
  status: 'pending' | 'active' | 'expired' | 'upgraded';
  expiresAt: Date;                   // 1 year from purchase

  // ===== BENEFITS =====
  benefits: {
    stealthBoost: number;            // Percentage boost
    commissionRate: number;          // Affiliate rate
    features: string[];              // List of unlocked features
  };

  createdAt: Date;
  updatedAt: Date;
}

// INDEXES
db.badges.createIndex({ userId: 1 });
db.badges.createIndex({ wallet: 1 });
db.badges.createIndex({ "nft.mintAddress": 1 }, { unique: true, sparse: true });
db.badges.createIndex({ tier: 1, status: 1 });
```

### Collection: `referrals`

```typescript
interface Referral {
  _id: ObjectId;

  // ===== PARTIES =====
  referrer: {
    userId: ObjectId;
    wallet: string;
    phantomId: string;
  };
  referred: {
    userId: ObjectId;
    wallet: string;
    phantomId: string;
  };

  // ===== CODE USED =====
  codeUsed: string;

  // ===== EARNINGS =====
  earnings: {
    commissionRate: number;          // At time of referral
    totalEarned: number;             // SOL
    pendingPayout: number;           // SOL
    paidOut: number;                 // SOL
  };

  // ===== CONVERSIONS =====
  conversions: Array<{
    type: 'badge_purchase' | 'subscription';
    tier?: string;                   // For badge
    months?: number;                 // For subscription
    amountPaid: number;              // SOL
    commission: number;              // SOL
    txSignature?: string;
    date: Date;
  }>;

  // ===== STATUS =====
  status: 'active' | 'inactive';

  referredAt: Date;
  lastEarningAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// INDEXES
db.referrals.createIndex({ "referrer.userId": 1 });
db.referrals.createIndex({ "referred.userId": 1 }, { unique: true });
db.referrals.createIndex({ codeUsed: 1 });
db.referrals.createIndex({ status: 1 });
```

### Collection: `whale_watchlist`

```typescript
interface WhaleWatchlist {
  _id: ObjectId;

  // ===== OWNER =====
  userId: ObjectId;

  // ===== WATCHED ITEMS =====
  whales: Array<{
    phantomId: string;
    addedAt: Date;
    notes?: string;
    alertsEnabled: boolean;
  }>;

  tokens: Array<{
    mint: string;
    symbol: string;
    addedAt: Date;
    alertThreshold?: number;         // USD threshold for alerts
    alertsEnabled: boolean;
  }>;

  // ===== LIMITS =====
  maxWhales: number;                 // Based on tier
  maxTokens: number;                 // Based on tier

  createdAt: Date;
  updatedAt: Date;
}

// INDEXES
db.whale_watchlist.createIndex({ userId: 1 }, { unique: true });
```

### Collection: `sessions`

```typescript
interface Session {
  _id: ObjectId;

  userId: ObjectId;
  wallet: string;
  privySessionId: string;

  device: {
    userAgent: string;
    ip: string;
    country?: string;
    device?: string;
  };

  expiresAt: Date;
  lastActivity: Date;
  createdAt: Date;
}

// INDEXES
db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ privySessionId: 1 }, { unique: true });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## 🔐 STEALTH WALLET SYSTEM (Shadow Vaults)

### Concept

Each user can create up to 10 **Shadow Vaults** - PDA-based wallets controlled by their main wallet.

```
Main Wallet (Command Center)
    │
    ├── Shadow Vault #1 "Trading Alpha"
    │       └── PDA: [main_wallet, 1, "shadow-vault"]
    │
    ├── Shadow Vault #2 "Cold Storage"
    │       └── PDA: [main_wallet, 2, "shadow-vault"]
    │
    ├── Shadow Vault #3 "DeFi Ops"
    │       └── PDA: [main_wallet, 3, "shadow-vault"]
    │
    └── ... up to 10 vaults
```

### PDA Derivation (for future contract)

```rust
// Smart contract will use these seeds
pub fn derive_vault_pda(
    user_wallet: &Pubkey,
    vault_number: u8,
    program_id: &Pubkey
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            user_wallet.as_ref(),
            &vault_number.to_le_bytes(),
            b"shadow-vault"
        ],
        program_id
    )
}
```

### Vault Operations

| Operation | Description | Privacy Level |
|-----------|-------------|---------------|
| Create Vault | Generate new PDA | Public (creation tx) |
| Deposit to Vault | Transfer from main wallet | Public |
| Vault-to-Vault Transfer | Internal movement | Can be private (ShadowWire) |
| Ghost Send | External anonymous transfer | Sender hidden |
| Dark Pool Deposit | Hide balance | Full privacy |
| Dark Pool Withdraw | Reveal balance | Public |

### Frontend Flow (Before Contract)

1. **UI creates vault entry in MongoDB**
   - Generates PDA address using seeds
   - Stores vault in database
   - Shows vault in UI

2. **Vault "works" in mock mode**
   - Balance shown as 0 (or mock data)
   - Transfer UI works but shows "Contract not deployed" message
   - All actions are logged for future sync

3. **When contract is deployed**
   - Run sync script to initialize all PDAs on-chain
   - All existing vaults become real
   - Seamless transition

### Pre-computed Vault Addresses

```typescript
// lib/anchor/vault-utils.ts

import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('11111111111111111111111111111111'); // Placeholder

export function deriveVaultAddress(
  userWallet: PublicKey,
  vaultNumber: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      userWallet.toBuffer(),
      Buffer.from([vaultNumber]),
      Buffer.from('shadow-vault')
    ],
    PROGRAM_ID
  );
}

// Pre-generate all 10 possible vault addresses for a user
export function generateAllVaultAddresses(userWallet: PublicKey) {
  const vaults = [];
  for (let i = 1; i <= 10; i++) {
    const [address, bump] = deriveVaultAddress(userWallet, i);
    vaults.push({ vaultNumber: i, address: address.toBase58(), bump });
  }
  return vaults;
}
```

---

## 📊 WHALE INTELLIGENCE ENGINE

### Data Sources

1. **Helius Webhooks** (Primary)
   - Subscribe to large transactions (>100 SOL)
   - Privacy pool deposits/withdrawals
   - Token transfers above threshold

2. **RPC Polling** (Secondary)
   - Known whale wallets monitoring
   - Token holder tracking
   - DEX activity

3. **Internal Data**
   - Anonymized activity from our users
   - Aggregate trends

### Whale Identification

```typescript
// Whale identification algorithm

interface WhaleProfile {
  walletHash: string;         // SHA256(wallet) for privacy
  phantomId: string;          // "Phantom #A3X9"

  // Classification
  tier: 'minnow' | 'dolphin' | 'whale' | 'mega_whale';
  estimatedHoldings: number;  // USD

  // Behavior patterns
  patterns: {
    prefersDarkPool: boolean;
    tradingFrequency: 'low' | 'medium' | 'high';
    tokenPreferences: string[];
    averageTradeSize: number;
    profitability: number;    // Estimated ROI
  };

  // Activity
  lastSeenAt: Date;
  totalTransactions: number;
}

// Tier thresholds
const WHALE_TIERS = {
  minnow: { min: 10, max: 100 },      // 10-100 SOL
  dolphin: { min: 100, max: 1000 },   // 100-1000 SOL
  whale: { min: 1000, max: 10000 },   // 1,000-10,000 SOL
  mega_whale: { min: 10000, max: Infinity }  // 10,000+ SOL
};
```

### Signal Generation

```typescript
interface WhaleSignal {
  token: string;
  signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  confidence: number;          // 0-100

  reasoning: {
    whaleNetFlow: number;      // Net buy/sell in USD
    uniqueWhales: number;      // Number of whales involved
    flowDirection: 'accumulating' | 'distributing' | 'mixed';
    priceCorrelation: number;  // How price moved with flow
  };

  // For display
  displayText: string;
  importance: 'low' | 'medium' | 'high';
}

// Example signal generation
function generateSignal(tokenData: TokenAccumulationData): WhaleSignal {
  const netFlow = tokenData.buys - tokenData.sells;
  const flowRatio = tokenData.buys / (tokenData.sells || 1);

  let signal: WhaleSignal['signal'];
  let confidence: number;

  if (flowRatio > 3) {
    signal = 'strong_buy';
    confidence = Math.min(95, 60 + tokenData.uniqueWhales * 5);
  } else if (flowRatio > 1.5) {
    signal = 'buy';
    confidence = Math.min(85, 50 + tokenData.uniqueWhales * 4);
  } else if (flowRatio > 0.67) {
    signal = 'neutral';
    confidence = 50;
  } else if (flowRatio > 0.33) {
    signal = 'sell';
    confidence = Math.min(85, 50 + tokenData.uniqueWhales * 4);
  } else {
    signal = 'strong_sell';
    confidence = Math.min(95, 60 + tokenData.uniqueWhales * 5);
  }

  return { signal, confidence, /* ... */ };
}
```

### Feed Algorithm

```typescript
// Whale feed prioritization

interface FeedItem {
  event: WhaleActivity;
  score: number;              // 0-100, higher = more important
  displayPriority: number;    // Position in feed
}

function calculateFeedScore(event: WhaleActivity): number {
  let score = 0;

  // Amount-based scoring (0-40 points)
  if (event.usdValue >= 1000000) score += 40;
  else if (event.usdValue >= 500000) score += 30;
  else if (event.usdValue >= 100000) score += 20;
  else if (event.usdValue >= 50000) score += 10;

  // Event type scoring (0-30 points)
  const typeScores = {
    'dark_pool_deposit': 30,   // High signal
    'token_accumulation': 25,
    'new_whale': 25,
    'whale_movement': 20,
    'large_transfer': 15,
    'swap': 10,
    'dark_pool_withdraw': 5,
  };
  score += typeScores[event.eventType] || 0;

  // Recency scoring (0-20 points)
  const ageMinutes = (Date.now() - event.createdAt.getTime()) / 60000;
  if (ageMinutes < 5) score += 20;
  else if (ageMinutes < 15) score += 15;
  else if (ageMinutes < 60) score += 10;
  else if (ageMinutes < 240) score += 5;

  // Followed whale bonus (0-10 points)
  // If user follows this whale, boost

  return score;
}
```

---

## 💰 P&L TRACKING SYSTEM

### Cost Basis Tracking

```typescript
interface TokenPosition {
  mint: string;
  symbol: string;

  // Holdings
  totalAmount: number;
  averageCostBasis: number;     // Per token in USD
  totalCostBasis: number;       // Total spent

  // Current
  currentPrice: number;
  currentValue: number;

  // P&L
  unrealizedPnl: number;        // (currentValue - totalCostBasis)
  unrealizedPnlPercent: number;

  // History
  lots: Array<{                 // FIFO tracking
    amount: number;
    costBasis: number;
    acquiredAt: Date;
    txSignature: string;
  }>;
}
```

### P&L Calculation

```typescript
// On every swap/trade, calculate P&L

interface TradeResult {
  realized: {
    pnl: number;                // USD
    costBasis: number;          // What we paid
    proceeds: number;           // What we got
    percentage: number;
  };

  newPosition: TokenPosition;   // Updated position
}

function calculateTradePnl(
  sellToken: string,
  sellAmount: number,
  receiveToken: string,
  receiveAmount: number,
  currentPrices: { [token: string]: number }
): TradeResult {
  // Get current position
  const position = getUserPosition(sellToken);

  // FIFO: use oldest lots first
  let remainingToSell = sellAmount;
  let totalCostBasis = 0;

  for (const lot of position.lots) {
    if (remainingToSell <= 0) break;

    const usedFromLot = Math.min(remainingToSell, lot.amount);
    totalCostBasis += usedFromLot * lot.costBasis;
    lot.amount -= usedFromLot;
    remainingToSell -= usedFromLot;
  }

  // Calculate P&L
  const proceeds = receiveAmount * currentPrices[receiveToken];
  const pnl = proceeds - totalCostBasis;

  return {
    realized: {
      pnl,
      costBasis: totalCostBasis,
      proceeds,
      percentage: (pnl / totalCostBasis) * 100
    },
    // ... update position
  };
}
```

### Portfolio Snapshots

```typescript
// Scheduled job: every hour/day

async function takePortfolioSnapshot(userId: ObjectId) {
  const user = await User.findById(userId);
  const vaults = await Vault.find({ userId });

  let totalValue = 0;
  const vaultSnapshots = [];
  const tokenBreakdown = new Map();

  for (const vault of vaults) {
    const vaultValue = await calculateVaultValue(vault);
    totalValue += vaultValue.totalUsd;

    vaultSnapshots.push({
      vaultId: vault._id,
      name: vault.name,
      valueUsd: vaultValue.totalUsd
    });

    // Aggregate tokens
    for (const token of vaultValue.tokens) {
      const existing = tokenBreakdown.get(token.mint) || { amount: 0, value: 0 };
      existing.amount += token.amount;
      existing.value += token.valueUsd;
      tokenBreakdown.set(token.mint, existing);
    }
  }

  // Get previous snapshots for P&L
  const dayAgo = await getSnapshot(userId, '24h');
  const weekAgo = await getSnapshot(userId, '7d');
  const monthAgo = await getSnapshot(userId, '30d');

  await PortfolioSnapshot.create({
    userId,
    timestamp: new Date(),
    interval: 'hourly',
    totalValueUsd: totalValue,
    vaults: vaultSnapshots,
    tokens: Array.from(tokenBreakdown.entries()).map(([mint, data]) => ({
      mint,
      amount: data.amount,
      valueUsd: data.value,
      allocation: (data.value / totalValue) * 100
    })),
    pnl: {
      daily: totalValue - (dayAgo?.totalValueUsd || totalValue),
      weekly: totalValue - (weekAgo?.totalValueUsd || totalValue),
      monthly: totalValue - (monthAgo?.totalValueUsd || totalValue),
      allTime: totalValue - user.stats.initialDeposit
    }
  });
}
```

### Chart Data API

```typescript
// GET /api/portfolio/chart?userId=xxx&period=30d

interface ChartDataPoint {
  timestamp: Date;
  value: number;
  pnl: number;
  pnlPercent: number;
}

interface ChartResponse {
  data: ChartDataPoint[];
  summary: {
    startValue: number;
    endValue: number;
    totalPnl: number;
    totalPnlPercent: number;
    highestValue: number;
    lowestValue: number;
    volatility: number;
  };
}
```

---

## 🚀 IMPLEMENTATION ORDER

### Phase 1: Foundation (Day 1-2)
```
1. Project Setup
   ├── Initialize Next.js 14 with TypeScript
   ├── Configure Tailwind CSS + theme
   ├── Setup shadcn/ui components
   ├── Configure MongoDB + Mongoose
   ├── Setup Docker compose
   └── Configure Privy

2. Database Setup
   ├── Create all schemas
   ├── Add indexes
   ├── Seed mock data
   └── Test queries

3. Auth Flow
   ├── Privy integration
   ├── Login/logout
   ├── Session management
   └── Protected routes
```

### Phase 2: Core UI (Day 2-3)
```
4. Layout Components
   ├── Navbar
   ├── Sidebar (responsive)
   ├── Mobile menu
   └── Footer

5. Landing Page
   ├── Hero section
   ├── Features grid
   ├── How it works
   └── CTA sections

6. Dashboard
   ├── Stealth rating card
   ├── Balance overview
   ├── Vault list
   ├── Quick actions
   └── Feed preview
```

### Phase 3: Vault System (Day 3-4)
```
7. Shadow Vaults
   ├── Vault list page
   ├── Create vault modal
   ├── Vault detail page
   ├── PDA derivation utils
   └── Mock balance display

8. Transfers
   ├── Transfer page UI
   ├── Vault-to-vault transfer
   ├── Ghost send UI
   ├── Dark pool deposit UI
   └── Progress modals
```

### Phase 4: Trading Features (Day 4-5)
```
9. Swap Integration
   ├── Jupiter SDK setup
   ├── Swap UI
   ├── Route display
   └── Transaction execution

10. Markets (PNP)
    ├── Markets list
    ├── Market detail
    ├── Bet placement UI
    └── Positions view
```

### Phase 5: Intelligence & P&L (Day 5-6)
```
11. Whale Intelligence
    ├── Helius webhook setup
    ├── Feed UI
    ├── Whale tracker
    ├── Token accumulation
    └── Watchlist

12. Portfolio & P&L
    ├── Portfolio overview
    ├── P&L charts
    ├── Holdings breakdown
    ├── Transaction history
    └── Export feature
```

### Phase 6: Monetization & Polish (Day 6-7)
```
13. Badges (UI Only)
    ├── Badge marketplace
    ├── Badge cards
    ├── Requirements checker
    └── Purchase flow (mock)

14. Affiliate
    ├── Dashboard
    ├── Referral links
    ├── Earnings display
    └── Leaderboard

15. Profile & Settings
    ├── Profile page
    ├── Settings tabs
    └── Notifications

16. Polish
    ├── Animations
    ├── Error handling
    ├── Loading states
    ├── Mobile optimization
    └── Documentation
```

### Phase 7: Smart Contract (Day 7+)
```
17. Contract Development
    ├── User registration
    ├── Vault creation
    ├── Badge minting
    ├── Subscription
    └── Testing

18. Integration
    ├── Connect UI to contract
    ├── Sync existing data
    └── Deploy to mainnet
```

---

## 📁 FINAL FOLDER STRUCTURE

```
whale-suite/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # Landing
│   │   ├── docs/
│   │   │   └── [...slug]/page.tsx   # Docs
│   │   └── connect/page.tsx         # Auth
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx               # Dashboard layout
│   │   ├── dashboard/page.tsx       # Main dashboard
│   │   ├── vaults/
│   │   │   ├── page.tsx             # Vault list
│   │   │   └── [id]/page.tsx        # Vault detail
│   │   ├── transfer/page.tsx        # Ghost Send
│   │   ├── swap/page.tsx            # Jupiter Swap
│   │   ├── markets/page.tsx         # PNP Markets
│   │   ├── intelligence/page.tsx    # Whale Intel
│   │   ├── portfolio/page.tsx       # P&L
│   │   ├── badges/page.tsx          # Badges
│   │   ├── affiliate/page.tsx       # Affiliate
│   │   ├── profile/page.tsx         # Profile
│   │   └── onboarding/page.tsx      # First-time
│   │
│   ├── api/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── vaults/
│   │   ├── transactions/
│   │   ├── whale-feed/
│   │   ├── portfolio/
│   │   ├── badges/
│   │   └── referrals/
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                          # shadcn/ui
│   ├── layout/                      # Nav, Sidebar
│   ├── dashboard/                   # Dashboard widgets
│   ├── vaults/                      # Vault components
│   ├── transfer/                    # Transfer forms
│   ├── swap/                        # Swap UI
│   ├── markets/                     # PNP components
│   ├── intelligence/                # Whale feed
│   ├── portfolio/                   # P&L charts
│   ├── badges/                      # Badge cards
│   ├── affiliate/                   # Referral UI
│   └── modals/                      # Modal components
│
├── lib/
│   ├── db/
│   │   ├── mongodb.ts
│   │   └── models/                  # All Mongoose models
│   ├── privy/
│   ├── solana/
│   │   ├── vault-utils.ts           # PDA derivation
│   │   └── connection.ts
│   ├── sdks/
│   │   ├── jupiter.ts
│   │   ├── helius.ts
│   │   ├── privacy-cash.ts
│   │   └── shadow-wire.ts
│   └── utils/
│
├── store/                           # Zustand
│
├── styles/
│   └── theme.css
│
├── public/
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## ✅ READY TO BUILD

This plan covers:
- ✅ All 16 pages with detailed specs
- ✅ Complete DB schema (10 collections)
- ✅ Shadow Vault (PDA) system
- ✅ Whale Intelligence engine
- ✅ P&L tracking system
- ✅ Contract-ready architecture
- ✅ Implementation order

**Next Step:** Start building Phase 1 - Foundation

Shall I proceed?
