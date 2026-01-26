# 🐋 WHALE TRADING SUITE - COMPLETE SPECIFICATION

> Privacy-First Trading Platform for Solana Whales  
> Solana Privacy Hack 2026 | Mainnet Production Ready

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Features Specification](#features-specification)
5. [Design System](#design-system)
6. [Smart Contract Architecture](#smart-contract-architecture)
7. [Database Schema](#database-schema)
8. [Authentication Flow](#authentication-flow)
9. [State Management](#state-management)
10. [Privacy SDKs Integration](#privacy-sdks-integration)
11. [Badge System](#badge-system)
12. [Affiliate System](#affiliate-system)
13. [UI Components](#ui-components)
14. [API Routes](#api-routes)
15. [Docker Setup](#docker-setup)
16. [Implementation Timeline](#implementation-timeline)
17. [Deployment](#deployment)

---

## 🎯 PROJECT OVERVIEW

### Problem Statement
Whales (large SOL holders) face critical privacy challenges:
- Every transaction is public → copycats follow moves
- Wallet balances visible → become targets
- No unified privacy platform → scattered tools
- Complex multi-wallet management

### Solution
**Whale Trading Suite**: All-in-one privacy platform with:
- Hidden balance management (Privacy Cash)
- Private transfers (ShadowWire)
- Anonymous betting (PNP Exchange)
- Best swap rates (Jupiter)
- Whale intelligence feed (Helius)
- NFT badge system with on-chain proof
- Affiliate monetization

### Target Users
- SOL holders with 1,000+ SOL
- Privacy-conscious traders
- Professional crypto investors
- OTC desk operators

---

## 🛠 TECH STACK

### Frontend
```
Framework: Next.js 14 (App Router)
Language: TypeScript 5
Styling: Tailwind CSS 3.4
UI Library: shadcn/ui
State: Zustand 4
Animations: Framer Motion
Wallet: Privy (embedded + external)
```

### Backend
```
API: Next.js API Routes
Database: MongoDB 7
ODM: Mongoose
Authentication: Privy Auth
Caching: Redis (optional)
```

### Blockchain
```
Network: Solana Mainnet
Framework: Anchor 0.29
Language: Rust
SDKs: 
  - Privacy Cash (@elusiv/sdk)
  - ShadowWire (@shadow-wire/sdk)
  - PNP Exchange (@pnp/sdk)
  - Helius (@helius-labs/sdk)
  - Jupiter (@jup-ag/core)
```

### DevOps
```
Containerization: Docker + Docker Compose
Deployment: Vercel (frontend) + Railway (backend)
CI/CD: GitHub Actions
Monitoring: Sentry
Analytics: PostHog
```

---

## 📁 PROJECT STRUCTURE (MONOREPO)

```
whale-suite/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── programs/                    # Anchor Smart Contracts
│   └── whale-suite/
│       ├── src/
│       │   ├── lib.rs
│       │   ├── instructions/
│       │   │   ├── mod.rs
│       │   │   ├── initialize.rs
│       │   │   ├── register.rs
│       │   │   ├── purchase_badge.rs
│       │   │   └── extend_subscription.rs
│       │   ├── state/
│       │   │   ├── mod.rs
│       │   │   ├── user_account.rs
│       │   │   └── global_state.rs
│       │   ├── error.rs
│       │   └── constants.rs
│       ├── tests/
│       │   └── whale-suite.ts
│       ├── Cargo.toml
│       └── Xargo.toml
│
├── app/                        # Next.js Application
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── transfer/
│   │   │   └── page.tsx
│   │   ├── swap/
│   │   │   └── page.tsx
│   │   ├── markets/
│   │   │   └── page.tsx
│   │   ├── badges/
│   │   │   └── page.tsx
│   │   ├── affiliate/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   │
│   ├── docs/
│   │   ├── page.tsx
│   │   ├── getting-started/
│   │   ├── privacy-tools/
│   │   ├── badge-system/
│   │   └── api-reference/
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── verify/route.ts
│   │   │   └── session/route.ts
│   │   ├── users/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── stats/route.ts
│   │   ├── badges/
│   │   │   ├── route.ts
│   │   │   └── verify/route.ts
│   │   ├── referrals/
│   │   │   ├── route.ts
│   │   │   └── earnings/route.ts
│   │   ├── transactions/
│   │   │   └── route.ts
│   │   ├── whale-feed/
│   │   │   └── route.ts
│   │   └── privacy-score/
│   │       └── route.ts
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/                 # React Components
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx
│   │   ├── progress.tsx
│   │   ├── sidebar.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   ├── mobile-menu.tsx
│   │   └── footer.tsx
│   │
│   ├── dashboard/
│   │   ├── balance-card.tsx
│   │   ├── privacy-score.tsx
│   │   ├── quick-actions.tsx
│   │   └── whale-feed.tsx
│   │
│   ├── privacy/
│   │   ├── privacy-cash-widget.tsx
│   │   ├── shadow-wire-transfer.tsx
│   │   └── jupiter-swap.tsx
│   │
│   ├── badges/
│   │   ├── badge-marketplace.tsx
│   │   ├── badge-card.tsx
│   │   └── nft-display.tsx
│   │
│   ├── affiliate/
│   │   ├── referral-dashboard.tsx
│   │   ├── earnings-chart.tsx
│   │   └── share-modal.tsx
│   │
│   └── modals/
│       ├── transaction-progress.tsx
│       ├── success-modal.tsx
│       └── error-modal.tsx
│
├── lib/                       # Utilities & Config
│   ├── anchor/
│   │   ├── setup.ts
│   │   ├── idl.json
│   │   └── utils.ts
│   │
│   ├── privacy-sdks/
│   │   ├── privacy-cash.ts
│   │   ├── shadow-wire.ts
│   │   ├── pnp.ts
│   │   ├── helius.ts
│   │   └── jupiter.ts
│   │
│   ├── database/
│   │   ├── mongodb.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Badge.ts
│   │   │   ├── Referral.ts
│   │   │   └── Transaction.ts
│   │   └── queries/
│   │
│   ├── privy/
│   │   ├── config.ts
│   │   └── hooks.ts
│   │
│   └── utils/
│       ├── constants.ts
│       ├── helpers.ts
│       └── validators.ts
│
├── store/                     # Zustand State Management
│   ├── index.ts
│   ├── slices/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── wallet.ts
│   │   ├── badges.ts
│   │   └── ui.ts
│   └── middleware.ts
│
├── styles/                    # Theme & Styles
│   ├── theme.css             # SINGLE THEME FILE
│   ├── components.css
│   └── animations.css
│
├── public/
│   ├── badges/
│   ├── icons/
│   └── images/
│
├── docker/
│   ├── Dockerfile.app
│   ├── Dockerfile.db
│   └── nginx.conf
│
├── scripts/
│   ├── deploy-contract.sh
│   ├── seed-db.ts
│   └── migrate.ts
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── Anchor.toml
└── README.md
```

---

## ✨ FEATURES SPECIFICATION

### Core Features (MVP)

#### 1. **Privacy Dashboard** ⭐⭐⭐
```
User sees at a glance:
- Hidden Balance (Privacy Cash)
- Privacy Score (0-1000)
- Transaction Stats (daily/weekly/monthly)
- Quick Actions (Deposit, Transfer, Swap, Bet)
- Whale Intelligence Feed
- Badge Status
- Affiliate Earnings

Mobile: Full-screen dashboard with swipe cards
Desktop: Grid layout with widgets
```

#### 2. **Privacy Cash Integration** ⭐⭐⭐
```
Actions:
- Deposit SOL → Hide balance
- Withdraw SOL → Reveal
- Check Private Balance
- Transaction History

Features:
- Progress modals during tx
- Success/error notifications
- Amount validation
- Gas estimation
- Transaction tracking in MongoDB

Mobile: Bottom sheet modals
Desktop: Center modals with backdrop
```

#### 3. **ShadowWire Transfers** ⭐⭐⭐
```
Types:
- Internal Transfer (amount hidden)
- External Transfer (sender anonymous)

Features:
- Recipient validation
- Amount input with privacy toggle
- Fee calculation
- Multi-step confirmation
- Transaction receipts

Mobile: Full-screen transfer form
Desktop: Modal-based flow
```

#### 4. **Jupiter Swaps** ⭐⭐
```
Features:
- Token selection (SOL, USDC, USDT, popular tokens)
- Best route finding
- Slippage settings
- Price impact warning
- Multi-wallet strategy tips

Note: Swaps are public - explain this to users
Suggestion: Use fresh wallet from multi-wallet manager

Mobile: Bottom sheet with token picker
Desktop: Side panel swap interface
```

#### 5. **PNP Anonymous Betting** ⭐⭐
```
Features:
- Browse markets
- Place bets anonymously
- View positions (private)
- Leaderboard (anonymous IDs)
- Winnings tracking

Mobile: Card-based market browser
Desktop: Table with filters
```

#### 6. **Whale Intelligence Feed** ⭐⭐⭐
```
Real-time feed showing:
- Large transactions (>100 SOL)
- Privacy pool deposits/withdrawals
- Token accumulation patterns
- Anonymized whale IDs (Whale #A34F)

Data source: Helius webhooks

Filters:
- Time range (24h, 7d, 30d)
- Transaction size
- Token type
- Activity type

Mobile: Vertical scrolling feed
Desktop: Sidebar + main feed
```

#### 7. **Multi-Wallet Manager** ⭐⭐
```
Features:
- Create new wallets (Privy embedded)
- View all wallets
- Consolidated balance view
- Quick transfer between wallets
- Wallet nicknames
- Export private keys (security warning)

Mobile: List view with expandable cards
Desktop: Grid view with actions
```

#### 8. **Badge NFT System** ⭐⭐⭐
```
Tiers:
- Bronze (0.5 SOL)
- Silver (2 SOL)
- Gold (5 SOL)
- Diamond (10 SOL)
- Legendary (25 SOL)

Each badge:
- NFT minted on-chain
- 1 year premium access
- Unique visual design
- Tradeable on secondary markets
- On-chain verification

Marketplace:
- Browse all tiers
- Compare benefits
- Purchase flow with progress
- NFT display in profile
- View on Solscan/Magic Eden

Mobile: Vertical card stack
Desktop: Grid with hover effects
```

#### 9. **Affiliate System** ⭐⭐⭐
```
Features:
- Generate referral code
- Track referrals
- View earnings (real-time)
- Withdrawal requests
- Social sharing (Twitter, Telegram)
- Leaderboard (top affiliates)

Commission Tiers:
- Free users: N/A
- Premium subscribers: 10%
- Badge holders: 15-25% (tier-based)

Dashboard shows:
- Total referred users
- Total earnings
- Pending payouts
- Conversion rate
- Share links

Mobile: Dashboard with share button
Desktop: Full analytics view
```

#### 10. **User Profile** ⭐⭐
```
Sections:
- User #999 (registration number)
- Badge NFT display
- Privacy score
- Stats (transactions, volume, days active)
- Achievements
- Settings
- Security (2FA, backup codes)

Mobile: Scrollable profile page
Desktop: Tabbed interface
```

#### 11. **Documentation Hub** ⭐
```
Pages:
- Getting Started
- Privacy Tools Guide
- Badge System Explained
- Affiliate Program
- API Reference
- FAQ
- Security Best Practices

Features:
- Search functionality
- Code examples
- Video tutorials
- Step-by-step guides

Mobile: Mobile-optimized docs
Desktop: Sidebar navigation
```

### Secondary Features

#### 12. **Transaction History** ⭐
```
Filter by:
- Type (deposit, withdraw, transfer, swap, bet)
- Date range
- Amount range
- Status (pending, success, failed)

Export: CSV, PDF

Mobile: List with filters at top
Desktop: Table with advanced filters
```

#### 13. **Notifications** ⭐
```
Types:
- Transaction confirmations
- Whale activity alerts
- Referral earnings
- Badge purchases
- Subscription renewals

Delivery:
- In-app notifications
- Email (optional)
- Telegram bot (future)

Mobile: Notification center
Desktop: Dropdown + page
```

#### 14. **Settings** ⭐
```
Categories:
- Profile (name, email)
- Security (2FA, sessions)
- Notifications (preferences)
- Privacy (data sharing)
- Wallet Management
- Theme (dark/darker)
- Language (EN, ES, CN)

Mobile: Full-screen settings
Desktop: Sidebar with sections
```

---

## 🎨 DESIGN SYSTEM

### Theme Configuration (Single File: styles/theme.css)

```css
/* ==========================================
   WHALE SUITE THEME SYSTEM
   Dark Cyberpunk - Green/Cyan
   Mobile-First Responsive Design
   ========================================== */

:root {
  /* ===== COLORS ===== */
  
  /* Background */
  --bg-primary: #0a0e14;
  --bg-secondary: #111820;
  --bg-tertiary: #1a1f2e;
  --bg-elevated: #222936;
  
  /* Neon Accents */
  --neon-green: #00ff88;
  --neon-cyan: #00d4ff;
  --neon-teal: #00ffcc;
  --neon-lime: #88ff00;
  
  /* Status Colors */
  --success: #00ff88;
  --error: #ff4444;
  --warning: #ffaa00;
  --info: #00d4ff;
  
  /* Text */
  --text-primary: #e8f4f8;
  --text-secondary: #a0b8c0;
  --text-muted: #6a7f8a;
  --text-disabled: #4a5560;
  
  /* Borders */
  --border-primary: rgba(0, 255, 136, 0.2);
  --border-secondary: rgba(255, 255, 255, 0.1);
  --border-focus: var(--neon-green);
  
  /* ===== SPACING ===== */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  
  /* ===== TYPOGRAPHY ===== */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  --text-4xl: 36px;
  --text-5xl: 48px;
  
  /* ===== EFFECTS ===== */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.7);
  
  --glow-sm: 0 0 10px rgba(0, 255, 136, 0.3);
  --glow-md: 0 0 20px rgba(0, 255, 136, 0.5);
  --glow-lg: 0 0 40px rgba(0, 255, 136, 0.7);
  
  --blur-sm: 10px;
  --blur-md: 20px;
  --blur-lg: 40px;
  
  /* ===== TRANSITIONS ===== */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* ===== BORDERS & RADIUS ===== */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  
  /* ===== Z-INDEX LAYERS ===== */
  --z-base: 1;
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-overlay: 1030;
  --z-modal: 1040;
  --z-popover: 1050;
  --z-tooltip: 1060;
  
  /* ===== BREAKPOINTS ===== */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
  
  /* ===== GRADIENTS ===== */
  --gradient-primary: linear-gradient(135deg, var(--neon-green) 0%, var(--neon-cyan) 100%);
  --gradient-secondary: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  --gradient-glow: radial-gradient(circle at center, rgba(0, 255, 136, 0.2) 0%, transparent 70%);
}

/* ===== MOBILE-FIRST RESPONSIVE UTILITIES ===== */

/* Base (Mobile) */
.container {
  width: 100%;
  padding-left: var(--space-md);
  padding-right: var(--space-md);
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    margin-left: auto;
    margin-right: auto;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

/* Large Desktop */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

### Component Patterns

#### Modal System
```
Mobile: Bottom sheet (slides up from bottom)
Desktop: Center modal with backdrop

States:
- Closed
- Opening (animation)
- Open
- Closing (animation)

Progress Modals:
- Step indicator (1/3, 2/3, 3/3)
- Progress bar (0-100%)
- Current action label
- Cancel button
- Auto-close on success (3s delay)
```

#### Sidebar Navigation
```
Mobile: 
- Hamburger menu (top-left)
- Full-screen overlay
- Slides in from left
- Close button (top-right)
- Backdrop (tap to close)

Desktop:
- Fixed left sidebar (256px)
- Always visible
- Hover effects
- Collapsible (80px → 256px)
```

#### Cards
```
Base:
- Background: var(--bg-tertiary)
- Border: 1px solid var(--border-primary)
- Radius: var(--radius-lg)
- Padding: var(--space-lg)
- Shadow: var(--shadow-md)

Hover:
- Border: var(--border-focus)
- Shadow: var(--glow-md)
- Transform: translateY(-2px)
```

#### Buttons
```
Primary:
- Background: var(--gradient-primary)
- Color: var(--bg-primary)
- Shadow: var(--glow-sm)
- Hover: scale(1.02) + glow-md

Secondary:
- Background: transparent
- Border: 2px solid var(--neon-green)
- Color: var(--neon-green)
- Hover: background rgba(0, 255, 136, 0.1)

Ghost:
- Background: transparent
- Color: var(--text-secondary)
- Hover: color var(--neon-green)
```

---

## ⛓ SMART CONTRACT ARCHITECTURE

### Program: WhaleSuite

**Program ID**: `WhaLeSuiteXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (Deploy to mainnet)

### PDA Structures

#### 1. Global State PDA
```rust
Seeds: [b"global-state"]

pub struct GlobalState {
    pub authority: Pubkey,      // Admin wallet
    pub treasury: Pubkey,        // Revenue wallet
    pub total_users: u64,        // User counter
    pub badge_prices: [u64; 5],  // [Bronze, Silver, Gold, Diamond, Legendary]
    pub subscription_price: u64, // Monthly price in lamports
    pub bump: u8,
}
```

#### 2. User Account PDA
```rust
Seeds: [b"user-account", user_wallet.key().as_ref()]

pub struct UserAccount {
    pub user_number: u64,           // Sequential #999
    pub wallet: Pubkey,             // User's wallet
    pub registered_at: i64,         // Unix timestamp
    
    // Badge
    pub badge_tier: BadgeTier,      // None | Bronze | Silver | Gold | Diamond | Legendary
    pub badge_mint: Option<Pubkey>, // NFT mint address
    pub badge_purchased_at: Option<i64>,
    
    // Subscription
    pub premium_expiry: i64,        // Unix timestamp
    pub is_premium: bool,           // Quick check
    pub total_spent: u64,           // Lifetime spending
    
    // Stats
    pub referral_code: String,      // Unique code
    pub referred_by: Option<Pubkey>, // Referrer's wallet
    pub total_referrals: u32,       // Count
    
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum BadgeTier {
    None,
    Bronze,
    Silver,
    Gold,
    Diamond,
    Legendary,
}
```

#### 3. Badge NFT Mint PDA
```rust
Seeds: [b"badge-mint", user_wallet.key().as_ref(), &tier_id.to_le_bytes()]

Standard Metaplex NFT with:
- Name: "Whale Suite - Gold Badge"
- Symbol: "WHALE"
- URI: https://whale-suite.com/metadata/gold.json
- Creators: [{ address: program_authority, verified: true, share: 100 }]
- Seller fee basis points: 500 (5% royalty)
```

### Instructions

#### 1. Initialize
```rust
pub fn initialize(
    ctx: Context<Initialize>,
    treasury: Pubkey,
) -> Result<()>
```

#### 2. Register (FREE)
```rust
pub fn register(
    ctx: Context<Register>,
) -> Result<()> {
    // Increment counter
    // Create user PDA
    // Assign user_number
    // Give 30 days free trial
    // Generate referral code
    // Emit event
}
```

#### 3. Purchase Badge (PAID + NFT)
```rust
pub fn purchase_badge(
    ctx: Context<PurchaseBadge>,
    tier: BadgeTier,
) -> Result<()> {
    // Validate payment amount
    // Transfer SOL to treasury
    // Mint NFT to user
    // Update user account (badge_tier, premium_expiry +1 year)
    // If referred_by exists, track commission
    // Emit event
}
```

#### 4. Extend Subscription (PAID)
```rust
pub fn extend_subscription(
    ctx: Context<ExtendSubscription>,
    months: u8,
) -> Result<()> {
    // Calculate cost (0.1 SOL * months)
    // Transfer SOL to treasury
    // Extend premium_expiry
    // Update is_premium
    // Emit event
}
```

#### 5. Check Status (READ-ONLY)
```rust
pub fn check_status(
    ctx: Context<CheckStatus>,
) -> Result<UserStatus> {
    // Return user data
    // No state changes
}
```

### Events

```rust
#[event]
pub struct UserRegistered {
    pub user_number: u64,
    pub wallet: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct BadgePurchased {
    pub user_number: u64,
    pub wallet: Pubkey,
    pub tier: BadgeTier,
    pub amount_paid: u64,
    pub nft_mint: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct SubscriptionExtended {
    pub user_number: u64,
    pub wallet: Pubkey,
    pub months: u8,
    pub amount_paid: u64,
    pub new_expiry: i64,
    pub timestamp: i64,
}
```

### Error Codes

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("User already registered")]
    AlreadyRegistered,
    
    #[msg("Invalid badge tier")]
    InvalidBadgeTier,
    
    #[msg("Insufficient payment")]
    InsufficientPayment,
    
    #[msg("User not registered")]
    NotRegistered,
    
    #[msg("Invalid subscription months (1-12)")]
    InvalidMonths,
}
```

---

## 🗄 DATABASE SCHEMA

### MongoDB Collections

#### 1. users
```typescript
interface User {
  _id: ObjectId;
  
  // Identity
  wallet: string;                    // Solana address
  email?: string;                    // From Privy
  privyId: string;                   // Privy user ID
  
  // On-chain data (synced from contract)
  userNumber: number;                // #999
  registeredAt: Date;
  
  // Badge
  badgeTier: 'none' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  badgeMint?: string;                // NFT mint address
  badgePurchasedAt?: Date;
  
  // Subscription
  isPremium: boolean;
  premiumExpiry: Date;
  
  // Privacy Stats
  privacyScore: number;              // 0-1000
  stats: {
    hiddenBalance: number;           // In Privacy Cash
    privateTransfers: number;        // Count
    anonymousBets: number;           // Count
    swapVolume: number;              // Total volume
    activeDays: number;              // Streak
  };
  
  // Referral
  referralCode: string;              // Unique code
  referredBy?: string;               // Referrer's wallet
  
  // Settings
  settings: {
    notifications: boolean;
    emailUpdates: boolean;
    language: string;
    theme: string;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

// Indexes
db.users.createIndex({ wallet: 1 }, { unique: true });
db.users.createIndex({ privyId: 1 }, { unique: true });
db.users.createIndex({ userNumber: 1 }, { unique: true });
db.users.createIndex({ referralCode: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });
```

#### 2. badges
```typescript
interface Badge {
  _id: ObjectId;
  userId: ObjectId;                  // Reference to users
  wallet: string;
  
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  mintAddress: string;               // NFT mint
  purchasePrice: number;             // In SOL
  txSignature: string;               // On-chain tx
  
  status: 'active' | 'upgraded' | 'sold';
  
  metadata: {
    name: string;
    image: string;
    attributes: Record<string, any>;
  };
  
  purchasedAt: Date;
  createdAt: Date;
}

// Indexes
db.badges.createIndex({ userId: 1 });
db.badges.createIndex({ wallet: 1 });
db.badges.createIndex({ mintAddress: 1 }, { unique: true });
db.badges.createIndex({ tier: 1 });
```

#### 3. referrals
```typescript
interface Referral {
  _id: ObjectId;
  
  // Parties
  referrerId: ObjectId;              // Who referred
  referrerWallet: string;
  referredUserId: ObjectId;          // Who was referred
  referredUserWallet: string;
  
  // Earnings
  commissionRate: number;            // Percentage (10-25)
  totalEarned: number;               // In SOL
  pendingPayout: number;             // Awaiting airdrop
  paidOut: number;                   // Already sent
  
  // Tracking
  conversions: {
    badgePurchase?: {
      tier: string;
      amount: number;
      commission: number;
      date: Date;
    };
    subscription?: {
      months: number;
      amount: number;
      commission: number;
      date: Date;
    }[];
  };
  
  // Status
  status: 'active' | 'inactive';
  
  // Metadata
  referredAt: Date;
  lastEarningAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.referrals.createIndex({ referrerId: 1 });
db.referrals.createIndex({ referredUserId: 1 });
db.referrals.createIndex({ referrerWallet: 1 });
db.referrals.createIndex({ status: 1 });
```

#### 4. transactions
```typescript
interface Transaction {
  _id: ObjectId;
  userId: ObjectId;
  wallet: string;
  
  // Type
  type: 'privacy_deposit' | 'privacy_withdraw' | 'shadow_transfer' | 
        'pnp_bet' | 'jupiter_swap' | 'badge_purchase' | 
        'subscription_payment' | 'referral_payout';
  
  // Details
  amount: number;                    // In SOL or token
  token?: string;                    // Mint address
  fee?: number;
  
  // Privacy SDK
  sdk?: 'privacy-cash' | 'shadow-wire' | 'pnp' | 'jupiter';
  
  // On-chain
  signature: string;
  slot: number;
  blockTime: number;
  
  // Status
  status: 'pending' | 'confirmed' | 'failed';
  errorMessage?: string;
  
  // Metadata
  metadata: Record<string, any>;
  createdAt: Date;
  confirmedAt?: Date;
}

// Indexes
db.transactions.createIndex({ userId: 1, createdAt: -1 });
db.transactions.createIndex({ wallet: 1 });
db.transactions.createIndex({ signature: 1 }, { unique: true });
db.transactions.createIndex({ type: 1 });
db.transactions.createIndex({ status: 1 });
db.transactions.createIndex({ createdAt: -1 });
```

#### 5. whale_feed
```typescript
interface WhaleFeedEvent {
  _id: ObjectId;
  
  // Anonymization
  whaleId: string;                   // Generated ID (Whale #A34F)
  walletHash: string;                // Hashed wallet (for tracking)
  
  // Event
  eventType: 'large_transfer' | 'privacy_deposit' | 'privacy_withdraw' | 
             'token_swap' | 'anonymous_bet';
  
  // Details
  amount?: number;
  token?: string;
  usdValue?: number;
  
  // On-chain
  signature: string;
  slot: number;
  blockTime: number;
  
  // Display
  displayText: string;               // "Whale #A34F deposited 50K SOL"
  
  createdAt: Date;
}

// Indexes
db.whale_feed.createIndex({ createdAt: -1 });
db.whale_feed.createIndex({ whaleId: 1 });
db.whale_feed.createIndex({ eventType: 1 });
db.whale_feed.createIndex({ blockTime: -1 });
```

#### 6. sessions
```typescript
interface Session {
  _id: ObjectId;
  userId: ObjectId;
  wallet: string;
  
  // Privy session
  privySessionId: string;
  accessToken: string;               // Encrypted
  refreshToken: string;              // Encrypted
  
  // Device
  userAgent: string;
  ipAddress: string;
  device: string;
  
  // Lifecycle
  expiresAt: Date;
  lastActivity: Date;
  createdAt: Date;
}

// Indexes
db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ privySessionId: 1 });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## 🔐 AUTHENTICATION FLOW

### Privy Integration

#### Configuration
```typescript
// lib/privy/config.ts

import { PrivyProvider } from '@privy-io/react-auth';

export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  
  config: {
    // Appearance
    appearance: {
      theme: 'dark',
      accentColor: '#00ff88',
      logo: '/logo.svg',
    },
    
    // Login methods
    loginMethods: ['email', 'wallet', 'google', 'twitter'],
    
    // Embedded wallets
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
      requireUserPasswordOnCreate: false,
    },
    
    // Supported wallets
    supportedChains: [solana],
    
    // Wallet connectors
    walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
    
    // Default chain
    defaultChain: solana,
  },
};
```

#### Auth Flow

**1. User Visits Site**
```
→ Check if authenticated (usePrivy hook)
→ If NO: Show login modal
→ If YES: Load user data from DB
```

**2. User Clicks "Connect Wallet"**
```
→ Privy modal opens
→ User chooses login method:
  - Email (magic link)
  - External wallet (Phantom/Solflare)
  - Social (Google/Twitter)
```

**3. After Privy Auth**
```
→ Get Privy user ID + wallet address
→ Check if wallet exists in DB:
  
  IF NOT EXIST:
    → Call smart contract register()
    → Get user number (#999)
    → Create user in MongoDB
    → Show welcome modal
    
  IF EXISTS:
    → Load user data from DB
    → Sync on-chain state (badge, subscription)
    → Update lastLoginAt
    → Redirect to dashboard
```

**4. Session Management**
```
→ Store Privy session in MongoDB
→ Use JWT for API authentication
→ Refresh token before expiry
→ Auto-logout after 7 days inactive
```

#### Auth API Routes

```typescript
// app/api/auth/verify/route.ts
POST /api/auth/verify
Body: { privyToken: string }
Response: { userId, wallet, userNumber, isPremium }

// app/api/auth/session/route.ts
GET /api/auth/session
Response: { user, session }

// app/api/auth/logout/route.ts
POST /api/auth/logout
Response: { success: boolean }
```

---

## 🏪 STATE MANAGEMENT (ZUSTAND)

### Store Structure

```typescript
// store/index.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface StoreState {
  // Auth
  auth: {
    isAuthenticated: boolean;
    userId: string | null;
    wallet: string | null;
    privyToken: string | null;
    login: (data: AuthData) => void;
    logout: () => void;
  };
  
  // User
  user: {
    userNumber: number | null;
    badgeTier: BadgeTier;
    isPremium: boolean;
    premiumExpiry: Date | null;
    privacyScore: number;
    stats: UserStats;
    referralCode: string | null;
    setUser: (data: UserData) => void;
    updateStats: (stats: Partial<UserStats>) => void;
  };
  
  // Wallet
  wallet: {
    connected: boolean;
    address: string | null;
    balance: number;
    hiddenBalance: number;
    connect: () => Promise<void>;
    disconnect: () => void;
    updateBalance: (balance: number) => void;
  };
  
  // Badges
  badges: {
    marketplace: Badge[];
    userBadges: Badge[];
    selectedTier: BadgeTier | null;
    loadMarketplace: () => Promise<void>;
    purchaseBadge: (tier: BadgeTier) => Promise<void>;
  };
  
  // UI
  ui: {
    sidebarOpen: boolean;
    modalOpen: string | null;
    loading: boolean;
    notification: Notification | null;
    toggleSidebar: () => void;
    openModal: (id: string) => void;
    closeModal: () => void;
    showNotification: (notification: Notification) => void;
  };
}

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state and actions...
      }),
      {
        name: 'whale-suite-storage',
        partialize: (state) => ({
          auth: state.auth,
          user: state.user,
        }),
      }
    )
  )
);
```

### Slices

```typescript
// store/slices/auth.ts
export const createAuthSlice = (set, get) => ({
  isAuthenticated: false,
  userId: null,
  wallet: null,
  privyToken: null,
  
  login: async (data) => {
    set({ auth: { ...data, isAuthenticated: true } });
  },
  
  logout: async () => {
    // Clear Privy session
    // Clear local storage
    set({ auth: initialAuthState });
  },
});

// store/slices/user.ts
export const createUserSlice = (set, get) => ({
  userNumber: null,
  badgeTier: 'none',
  isPremium: false,
  premiumExpiry: null,
  privacyScore: 0,
  stats: {},
  referralCode: null,
  
  setUser: (data) => {
    set({ user: data });
  },
  
  updateStats: (stats) => {
    set((state) => ({
      user: {
        ...state.user,
        stats: { ...state.user.stats, ...stats },
      },
    }));
  },
});

// Similar for wallet, badges, ui slices...
```

---

## 🔌 PRIVACY SDKS INTEGRATION

### 1. Privacy Cash (Elusiv)

```typescript
// lib/privacy-sdks/privacy-cash.ts

import { Elusiv, PRIVACY_CASH_PROGRAM_ID } from '@elusiv/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

export class PrivacyCashService {
  private elusiv: Elusiv;
  
  constructor(connection: Connection, wallet: any) {
    this.elusiv = new Elusiv(
      connection,
      wallet,
      PRIVACY_CASH_PROGRAM_ID
    );
  }
  
  async deposit(amount: number, token: 'SOL' | 'USDC' | 'USDT') {
    try {
      const tx = await this.elusiv.buildDepositTx(amount, token);
      const signature = await tx.send();
      return { success: true, signature };
    } catch (error) {
      return { success: false, error };
    }
  }
  
  async withdraw(amount: number, recipient: PublicKey) {
    try {
      const tx = await this.elusiv.buildWithdrawTx(amount, recipient);
      const signature = await tx.send();
      return { success: true, signature };
    } catch (error) {
      return { success: false, error };
    }
  }
  
  async getPrivateBalance(token: 'SOL' | 'USDC' | 'USDT') {
    try {
      const balance = await this.elusiv.getPrivateBalance(token);
      return { success: true, balance };
    } catch (error) {
      return { success: false, error };
    }
  }
}

// Usage in components
const privacyCash = new PrivacyCashService(connection, wallet);
const result = await privacyCash.deposit(100, 'SOL');
```

### 2. ShadowWire

```typescript
// lib/privacy-sdks/shadow-wire.ts

import { ShadowWire } from '@shadow-wire/sdk';

export class ShadowWireService {
  private shadowWire: ShadowWire;
  
  constructor(connection: Connection, wallet: any) {
    this.shadowWire = new ShadowWire(connection, wallet);
  }
  
  async internalTransfer(amount: number, recipient: PublicKey) {
    // Amount is hidden via Bulletproofs
    try {
      const tx = await this.shadowWire.buildInternalTransferTx(
        amount,
        recipient
      );
      const signature = await tx.send();
      return { success: true, signature };
    } catch (error) {
      return { success: false, error };
    }
  }
  
  async externalTransfer(amount: number, recipient: PublicKey) {
    // Sender is anonymous
    try {
      const tx = await this.shadowWire.buildExternalTransferTx(
        amount,
        recipient
      );
      const signature = await tx.send();
      return { success: true, signature };
    } catch (error) {
      return { success: false, error };
    }
  }
}
```

### 3. PNP Exchange

```typescript
// lib/privacy-sdks/pnp.ts

import { PNPExchange } from '@pnp/sdk';

export class PNPService {
  private pnp: PNPExchange;
  
  constructor(connection: Connection, wallet: any) {
    this.pnp = new PNPExchange(connection, wallet);
  }
  
  async fetchMarkets() {
    try {
      const markets = await this.pnp.fetchMarkets();
      return { success: true, markets };
    } catch (error) {
      return { success: false, error };
    }
  }
  
  async placeBet(marketId: string, amount: number, outcome: boolean) {
    try {
      const tx = await this.pnp.buildBetTx(marketId, amount, outcome);
      const signature = await tx.send();
      return { success: true, signature };
    } catch (error) {
      return { success: false, error };
    }
  }
  
  async claimWinnings(betId: string) {
    try {
      const tx = await this.pnp.buildClaimTx(betId);
      const signature = await tx.send();
      return { success: true, signature };
    } catch (error) {
      return { success: false, error };
    }
  }
}
```

### 4. Helius

```typescript
// lib/privacy-sdks/helius.ts

import { Helius } from '@helius-labs/sdk';

export class HeliusService {
  private helius: Helius;
  
  constructor(apiKey: string) {
    this.helius = new Helius(apiKey);
  }
  
  // Webhook for whale feed
  async setupWebhook(webhookUrl: string) {
    return await this.helius.createWebhook({
      webhookURL: webhookUrl,
      transactionTypes: ['TRANSFER'],
      accountAddresses: [], // Add whale addresses
      webhookType: 'enhanced',
    });
  }
  
  // Get transaction with enhanced data
  async getTransaction(signature: string) {
    return await this.helius.getTransaction(signature);
  }
  
  // Get whale addresses (large holders)
  async getTopHolders(mint: string, limit: number = 100) {
    return await this.helius.getTokenLargestAccounts(mint, limit);
  }
}
```

### 5. Jupiter

```typescript
// lib/privacy-sdks/jupiter.ts

import { Jupiter, RouteInfo } from '@jup-ag/core';

export class JupiterService {
  private jupiter: Jupiter;
  
  async initialize(connection: Connection, wallet: any) {
    this.jupiter = await Jupiter.load({
      connection,
      cluster: 'mainnet-beta',
      user: wallet.publicKey,
    });
  }
  
  async getRoutes(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: number
  ): Promise<RouteInfo[]> {
    return await this.jupiter.computeRoutes({
      inputMint,
      outputMint,
      amount,
      slippageBps: 50, // 0.5%
    });
  }
  
  async swap(route: RouteInfo) {
    try {
      const { swapTransaction } = await this.jupiter.exchange({
        routeInfo: route,
      });
      const signature = await swapTransaction.send();
      return { success: true, signature };
    } catch (error) {
      return { success: false, error };
    }
  }
}
```

---

## 🎖 BADGE SYSTEM

### Badge Tiers & Pricing

```typescript
export const BADGE_TIERS = {
  BRONZE: {
    id: 1,
    name: 'Bronze Ghost',
    price: 0.5, // SOL
    color: '#CD7F32',
    icon: '🥉',
    benefits: [
      '1 year premium access',
      '+10% privacy score boost',
      'Bronze badge NFT',
      '5% affiliate commission',
    ],
    requirements: {
      privacyScore: 50,
      hiddenBalance: 10,
      privateTransfers: 5,
      activeDays: 3,
    },
  },
  SILVER: {
    id: 2,
    name: 'Silver Shadow',
    price: 2,
    color: '#C0C0C0',
    icon: '🥈',
    benefits: [
      '1 year premium access',
      '+25% privacy score boost',
      'Silver badge NFT',
      '10% affiliate commission',
      'Silver Lounge access',
    ],
    requirements: {
      privacyScore: 150,
      hiddenBalance: 50,
      privateTransfers: 20,
      anonymousBets: 10,
      activeDays: 7,
    },
  },
  GOLD: {
    id: 3,
    name: 'Gold Phantom',
    price: 5,
    color: '#FFD700',
    icon: '🥇',
    benefits: [
      '1 year premium access',
      '+50% privacy score boost',
      'Gold badge NFT',
      '15% affiliate commission',
      'Custom themes',
      'Priority support',
      'Monthly raffle entry',
    ],
    requirements: {
      privacyScore: 300,
      hiddenBalance: 200,
      privateTransfers: 50,
      anonymousBets: 30,
      activeDays: 14,
      referrals: 3,
    },
  },
  DIAMOND: {
    id: 4,
    name: 'Diamond Whale',
    price: 10,
    color: '#B9F2FF',
    icon: '💎',
    benefits: [
      '1 year premium access',
      '+100% privacy score boost',
      'Diamond badge NFT',
      '20% affiliate commission',
      'Whale Club access',
      'NFT minting privileges',
      'Feature voting rights',
      'Quarterly raffle',
    ],
    requirements: {
      privacyScore: 500,
      hiddenBalance: 1000,
      privateTransfers: 100,
      anonymousBets: 50,
      activeDays: 30,
      referrals: 10,
      previousBadge: 'GOLD',
    },
  },
  LEGENDARY: {
    id: 5,
    name: 'Legendary Titan',
    price: 25,
    color: '#FF00FF',
    icon: '👑',
    benefits: [
      '1 year premium access',
      '+200% privacy score boost',
      'Legendary badge NFT',
      '25% affiliate commission',
      '1% lifetime revenue share',
      'Custom badge design',
      'Lifetime priority support',
      'Hall of Fame',
      'Advisory board invitation',
    ],
    requirements: {
      privacyScore: 1000,
      hiddenBalance: 5000,
      privateTransfers: 250,
      anonymousBets: 100,
      activeDays: 60,
      referrals: 25,
      previousBadge: 'DIAMOND',
      manualApproval: true,
    },
  },
};
```

### Badge Purchase Flow

```
1. User browses badge marketplace
2. User clicks "Purchase Gold Badge"
3. Modal opens with:
   - Tier details
   - Price (5 SOL)
   - Benefits list
   - Requirements check
   - "Confirm Purchase" button
   
4. User clicks "Confirm Purchase"
5. Progress modal appears:
   [Step 1/3] Checking requirements...
   [Step 2/3] Processing payment...
   [Step 3/3] Minting NFT badge...
   
6. Transaction flow:
   a. Check user meets requirements (API call)
   b. Build smart contract transaction
   c. User signs with Privy wallet
   d. Contract executes:
      - Transfer 5 SOL to treasury
      - Mint NFT to user
      - Update user account (badge_tier, premium_expiry)
   e. Wait for confirmation (3-5 seconds)
   
7. Success modal appears:
   "🎉 Gold Badge Claimed!"
   - Shows NFT image
   - "View on Solscan" link
   - "View in Profile" button
   - Auto-close in 5 seconds
   
8. Update frontend state:
   - Refresh user data
   - Show badge in navigation
   - Update privacy score (+50%)
   - Redirect to profile
```

### NFT Metadata

```json
{
  "name": "Whale Suite - Gold Phantom",
  "symbol": "WHALE",
  "description": "Gold tier badge for Whale Trading Suite. Grants 1 year premium access and exclusive benefits.",
  "image": "https://whale-suite.com/nft/gold.png",
  "animation_url": "https://whale-suite.com/nft/gold.mp4",
  "attributes": [
    {
      "trait_type": "Tier",
      "value": "Gold"
    },
    {
      "trait_type": "User Number",
      "value": "999"
    },
    {
      "trait_type": "Privacy Score Boost",
      "value": "+50%"
    },
    {
      "trait_type": "Commission Rate",
      "value": "15%"
    },
    {
      "trait_type": "Issue Date",
      "value": "2026-01-26"
    }
  ],
  "properties": {
    "category": "image",
    "creators": [
      {
        "address": "WhaLeSuiteXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "share": 100
      }
    ]
  }
}
```

---

## 💰 AFFILIATE SYSTEM

### Commission Structure

```typescript
export const COMMISSION_RATES = {
  FREE: 0,           // Free users can't refer
  PREMIUM: 0.10,     // 10% on referrals
  BRONZE: 0.05,      // 5% + base premium
  SILVER: 0.10,      // 10% + base premium
  GOLD: 0.15,        // 15% + base premium
  DIAMOND: 0.20,     // 20% + base premium
  LEGENDARY: 0.25,   // 25% + base premium + 1% revenue share
};

// Example: Gold badge holder refers someone who buys Silver badge (2 SOL)
// Commission = 2 SOL * 0.15 = 0.3 SOL
```

### Referral Flow

```
1. User (with premium/badge) goes to Affiliate Dashboard
2. System generates unique referral code: "WHALE999"
3. User gets referral link: https://whale-suite.com?ref=WHALE999
4. User shares link on Twitter/Telegram
5. New user clicks link → registers → cookie stores ref code
6. New user purchases badge or subscription
7. Smart contract emits event with purchase details
8. Backend tracks referral in MongoDB:
   - referrerId, referredUserId
   - commission amount
   - status: 'pending'
9. Weekly/monthly, admin reviews pending payouts
10. Admin uses bulk airdrop script:
    - Read all pending referrals
    - Calculate total per referrer
    - Send SOL airdrops
    - Update status to 'paid'
11. Referrer sees updated earnings in dashboard
```

### Affiliate Dashboard

```
Components:
1. Overview Card:
   - Total Earnings: 12.5 SOL ($1,875)
   - Pending Payout: 2.3 SOL ($345)
   - Total Referrals: 47
   - Conversion Rate: 12%

2. Referral Link Card:
   - Your Code: WHALE999
   - Link: https://whale-suite.com?ref=WHALE999
   - Copy button
   - Share buttons (Twitter, Telegram, Discord)

3. Earnings Chart:
   - Line chart showing earnings over time
   - Filter: 7d, 30d, All Time

4. Referral List:
   - Table with columns:
     - User (anonymized: User #1234)
     - Purchase Type (Badge/Subscription)
     - Amount
     - Commission
     - Date
     - Status (Pending/Paid)

5. Withdrawal Section:
   - Minimum: 0.1 SOL
   - Fee: 5%
   - "Request Payout" button
   - Status indicator

6. Leaderboard:
   - Top 10 affiliates
   - Rank, Earnings, Referrals
   - "Join Elite" CTA
```

### Social Sharing

```typescript
// components/affiliate/share-modal.tsx

const shareToTwitter = (code: string) => {
  const text = `I'm using Whale Suite for private Solana trading! 🐋\n\nJoin me and get 30 days free premium:\n`;
  const url = `https://whale-suite.com?ref=${code}`;
  const hashtags = 'Solana,Privacy,Web3';
  
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`,
    '_blank'
  );
};

const shareToTelegram = (code: string) => {
  const text = `Check out Whale Suite - privacy-first trading on Solana!\n\n${url}`;
  const url = `https://whale-suite.com?ref=${code}`;
  
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    '_blank'
  );
};
```

---

## 🎨 UI COMPONENTS

### Modal System

#### Transaction Progress Modal

```tsx
// components/modals/transaction-progress.tsx

interface TransactionProgressProps {
  isOpen: boolean;
  steps: string[];
  currentStep: number;
  onClose: () => void;
}

/*
Mobile: Bottom sheet (slides from bottom, 90% height)
Desktop: Center modal (max-width 500px)

Layout:
- Header with close button
- Progress bar (0-100%)
- Step indicator (1/3, 2/3, 3/3)
- Current action text
- Animated loading spinner
- Cancel button (if applicable)

States:
- Processing (spinner animation)
- Success (checkmark animation)
- Error (error icon + message)

Auto-close: 3 seconds after success
*/
```

#### Success Modal

```tsx
// components/modals/success-modal.tsx

/*
Features:
- Confetti animation
- Success checkmark (animated)
- Title: "Transaction Successful!"
- Details (amount, signature)
- Action buttons (View on Solscan, Go to Dashboard)
- Auto-close countdown

Mobile: Full-screen overlay
Desktop: Center modal (max-width 400px)
*/
```

### Sidebar Navigation

```tsx
// components/layout/sidebar.tsx

/*
Mobile:
- Triggered by hamburger menu
- Slides in from left
- Full-screen overlay (backdrop)
- Close button (top-right)
- User profile at top
- Navigation links
- Logout at bottom

Desktop:
- Fixed left sidebar (256px width)
- Always visible
- Collapsible to icon-only (80px)
- Hover to expand
- Smooth transitions

Links:
- Dashboard (home icon)
- Transfer (send icon)
- Swap (swap icon)
- Markets (chart icon)
- Badges (award icon)
- Affiliate (users icon)
- Profile (user icon)
- Docs (book icon)
- Settings (gear icon)
*/
```

### Cards

```tsx
// components/ui/card.tsx

/*
Base Card:
- Background: var(--bg-tertiary)
- Border: 1px solid var(--border-primary)
- Radius: var(--radius-lg)
- Padding: var(--space-lg)
- Shadow: var(--shadow-md)

Hover:
- Border: var(--border-focus)
- Shadow: var(--glow-md)
- Transform: translateY(-2px)
- Transition: var(--transition-base)

Variants:
- default
- elevated (more shadow)
- interactive (hover effects)
- bordered (thicker border)
*/
```

### Buttons

```tsx
// components/ui/button.tsx

/*
Variants:
1. Primary (gradient background, neon glow)
2. Secondary (transparent + neon border)
3. Ghost (transparent, minimal)
4. Destructive (red accent)

Sizes:
- sm (padding: 8px 16px, text: 14px)
- md (padding: 12px 24px, text: 16px)
- lg (padding: 16px 32px, text: 18px)

States:
- Default
- Hover (scale + glow)
- Active (scale down)
- Disabled (opacity 0.5, cursor not-allowed)
- Loading (spinner icon)
*/
```

### Progress Bar

```tsx
// components/ui/progress.tsx

/*
Features:
- Animated fill (0-100%)
- Percentage text
- Smooth transitions
- Color based on value:
  - 0-33%: error color
  - 34-66%: warning color
  - 67-100%: success color

Variants:
- Linear (horizontal bar)
- Circular (ring)
- Step-based (discrete steps)
*/
```

---

## 🛣 API ROUTES

### Authentication

```typescript
// app/api/auth/verify/route.ts
POST /api/auth/verify
Body: { privyToken: string }
Response: { 
  success: boolean,
  user: { userId, wallet, userNumber, isPremium },
  session: { sessionId, expiresAt }
}

// app/api/auth/session/route.ts
GET /api/auth/session
Headers: { Authorization: Bearer <token> }
Response: { user, session }

// app/api/auth/logout/route.ts
POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
Response: { success: boolean }
```

### Users

```typescript
// app/api/users/route.ts
GET /api/users
Query: { page, limit, sort }
Response: { users: [], total, page }

POST /api/users
Body: { wallet, privyId, email }
Response: { user }

// app/api/users/[id]/route.ts
GET /api/users/[id]
Response: { user }

PATCH /api/users/[id]
Body: { ...updates }
Response: { user }

// app/api/users/stats/route.ts
GET /api/users/[id]/stats
Response: { privacyScore, stats }

POST /api/users/[id]/stats
Body: { ...stats }
Response: { privacyScore, stats }
```

### Badges

```typescript
// app/api/badges/route.ts
GET /api/badges
Query: { userId?, tier? }
Response: { badges: [] }

POST /api/badges
Body: { userId, tier, mintAddress, txSignature }
Response: { badge }

// app/api/badges/verify/route.ts
POST /api/badges/verify
Body: { mintAddress }
Response: { valid: boolean, badge? }
```

### Referrals

```typescript
// app/api/referrals/route.ts
GET /api/referrals
Query: { referrerId?, status? }
Response: { referrals: [] }

POST /api/referrals
Body: { referrerId, referredUserId }
Response: { referral }

// app/api/referrals/earnings/route.ts
GET /api/referrals/earnings/[referrerId]
Response: { 
  totalEarned, 
  pendingPayout, 
  paidOut,
  referrals: []
}

POST /api/referrals/payout
Body: { referrerId, amount }
Response: { success, txSignature }
```

### Transactions

```typescript
// app/api/transactions/route.ts
GET /api/transactions
Query: { userId?, type?, status?, page, limit }
Response: { transactions: [], total, page }

POST /api/transactions
Body: { userId, type, amount, signature, ...metadata }
Response: { transaction }
```

### Whale Feed

```typescript
// app/api/whale-feed/route.ts
GET /api/whale-feed
Query: { limit?, offset?, eventType? }
Response: { events: [], hasMore }

// Webhook endpoint for Helius
POST /api/whale-feed/webhook
Body: { ...helius webhook data }
Response: { received: true }
```

### Privacy Score

```typescript
// app/api/privacy-score/route.ts
GET /api/privacy-score/[userId]
Response: { score, breakdown, rank }

POST /api/privacy-score/calculate
Body: { userId }
Response: { score, updated }
```

---

## 🐳 DOCKER SETUP

### docker-compose.yml

```yaml
version: '3.8'

services:
  # Next.js App
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile.app
    ports:
      - "3000:3000"
    environment:
      # Database
      - MONGODB_URI=mongodb://mongo:27017/whale-suite
      
      # Privy
      - NEXT_PUBLIC_PRIVY_APP_ID=${PRIVY_APP_ID}
      - PRIVY_APP_SECRET=${PRIVY_APP_SECRET}
      
      # Solana
      - NEXT_PUBLIC_SOLANA_RPC=${SOLANA_RPC}
      - NEXT_PUBLIC_HELIUS_API_KEY=${HELIUS_API_KEY}
      
      # Smart Contract
      - NEXT_PUBLIC_PROGRAM_ID=${PROGRAM_ID}
      
      # App
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
      - NODE_ENV=development
    depends_on:
      - mongo
    volumes:
      - ./app:/app/app
      - ./components:/app/components
      - ./lib:/app/lib
      - ./store:/app/store
      - ./styles:/app/styles
    command: npm run dev

  # MongoDB
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=whale-suite
    volumes:
      - mongo-data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/init.js:ro
    command: mongod --auth

  # Mongo Express (DB Admin UI)
  mongo-express:
    image: mongo-express:latest
    ports:
      - "8081:8081"
    environment:
      - ME_CONFIG_MONGODB_URL=mongodb://mongo:27017
      - ME_CONFIG_BASICAUTH_USERNAME=admin
      - ME_CONFIG_BASICAUTH_PASSWORD=admin123
    depends_on:
      - mongo

  # Redis (Optional - for caching)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  mongo-data:
  redis-data:
```

### Dockerfile.app

```dockerfile
# docker/Dockerfile.app

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js app
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Quick Start Commands

```bash
# 1. Clone repository
git clone <repo-url>
cd whale-suite

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your values

# 3. Start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f app

# 5. Stop services
docker-compose down

# 6. Rebuild after changes
docker-compose up -d --build

# 7. Access services
# App: http://localhost:3000
# Mongo Express: http://localhost:8081
# MongoDB: mongodb://localhost:27017

# 8. Deploy smart contract
cd programs/whale-suite
anchor build
anchor deploy --provider.cluster mainnet
# Copy program ID to .env
```

---

## 📅 IMPLEMENTATION TIMELINE

### Day 1: Foundation (8-10 hours)
```
Morning (4 hours):
- ✅ Setup monorepo structure
- ✅ Initialize Next.js project
- ✅ Configure Tailwind + theme system
- ✅ Setup Docker compose
- ✅ Initialize MongoDB schemas
- ✅ Configure Privy

Afternoon (4 hours):
- ✅ Initialize Anchor project
- ✅ Write smart contract (register, purchase_badge)
- ✅ Write tests
- ✅ Deploy to mainnet
- ✅ Get program ID

Evening (2 hours):
- ✅ Setup Zustand store
- ✅ Create base layout
- ✅ Implement auth flow
```

### Day 2: Core Privacy Features (8-10 hours)
```
Morning (4 hours):
- ✅ Privacy Cash integration
- ✅ Dashboard UI
- ✅ Balance card component
- ✅ Deposit/withdraw flows

Afternoon (4 hours):
- ✅ ShadowWire integration
- ✅ Transfer UI
- ✅ Progress modals
- ✅ Transaction tracking

Evening (2 hours):
- ✅ Jupiter integration
- ✅ Swap UI
- ✅ Multi-wallet tips
```

### Day 3: Badges & Monetization (8-10 hours)
```
Morning (4 hours):
- ✅ Badge marketplace UI
- ✅ Purchase flow
- ✅ NFT minting integration
- ✅ Success animations

Afternoon (4 hours):
- ✅ Affiliate dashboard
- ✅ Referral tracking
- ✅ Earnings display
- ✅ Social sharing

Evening (2 hours):
- ✅ Subscription management
- ✅ Premium features gating
```

### Day 4: Additional Features (8-10 hours)
```
Morning (4 hours):
- ✅ PNP Exchange integration
- ✅ Markets browser UI
- ✅ Betting flow

Afternoon (4 hours):
- ✅ Helius webhooks
- ✅ Whale intelligence feed
- ✅ Real-time updates
- ✅ Feed UI

Evening (2 hours):
- ✅ User profile
- ✅ Settings page
- ✅ Privacy score display
```

### Day 5: Polish & Testing (8-10 hours)
```
Morning (4 hours):
- ✅ Mobile responsiveness
- ✅ Animations & transitions
- ✅ Error handling
- ✅ Loading states

Afternoon (4 hours):
- ✅ End-to-end testing
- ✅ Bug fixes
- ✅ Performance optimization
- ✅ Security review

Evening (2 hours):
- ✅ Documentation page
- ✅ FAQ section
- ✅ Help modals
```

### Day 6: Demo & Submission (6-8 hours)
```
Morning (3 hours):
- ✅ Record demo video (90 seconds)
- ✅ Screenshots
- ✅ Write submission description

Afternoon (3 hours):
- ✅ Final deployment
- ✅ Domain setup
- ✅ Analytics integration
- ✅ Submit to hackathon

Evening (2 hours):
- ✅ Social media posts
- ✅ Documentation polish
- ✅ README updates
```

---

## 🚀 DEPLOYMENT

### Mainnet Deployment

#### Smart Contract
```bash
# Build
anchor build

# Deploy to mainnet
anchor deploy --provider.cluster mainnet --provider.wallet ~/.config/solana/id.json

# Verify deployment
solana program show <PROGRAM_ID> --url mainnet-beta

# Update IDL
anchor idl init <PROGRAM_ID> --filepath target/idl/whale_suite.json --provider.cluster mainnet
```

#### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Environment variables (set in Vercel dashboard):
MONGODB_URI
PRIVY_APP_ID
PRIVY_APP_SECRET
NEXT_PUBLIC_SOLANA_RPC
NEXT_PUBLIC_HELIUS_API_KEY
NEXT_PUBLIC_PROGRAM_ID
NEXT_PUBLIC_APP_URL
```

#### Database (MongoDB Atlas)
```bash
# 1. Create cluster at mongodb.com
# 2. Whitelist IP: 0.0.0.0/0
# 3. Create database user
# 4. Get connection string
# 5. Add to .env: MONGODB_URI
```

### Environment Variables

```bash
# .env.production

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/whale-suite

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=clxxxxxxxxxxxxxxxxxxx
PRIVY_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Solana
NEXT_PUBLIC_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=xxxxx
NEXT_PUBLIC_HELIUS_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# Smart Contract
NEXT_PUBLIC_PROGRAM_ID=WhaLeSuiteXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# App
NEXT_PUBLIC_APP_URL=https://whale-suite.com
NODE_ENV=production

# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxx
SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxxx
```

### Post-Deployment Checklist

```
✅ Smart contract deployed to mainnet
✅ Program ID updated in .env
✅ Frontend deployed to Vercel
✅ Database connected (MongoDB Atlas)
✅ Privy configured with production URL
✅ Domain setup (whale-suite.com)
✅ SSL certificate active
✅ Analytics tracking (PostHog)
✅ Error monitoring (Sentry)
✅ Helius webhooks configured
✅ NFT metadata hosted
✅ Documentation live
✅ Social media accounts created
✅ Discord/Telegram communities
✅ Submit to hackathon platform
```

---

## 📚 ADDITIONAL NOTES

### Security Considerations

```
1. Smart Contract:
   - Audit before mainnet (use Sec3 or OtterSec)
   - Rate limiting on minting
   - Reentrancy guards
   - Overflow/underflow checks
   - Access control on admin functions

2. Frontend:
   - Environment variables never exposed
   - API routes protected with auth
   - Input validation on all forms
   - XSS prevention
   - CSRF tokens

3. Database:
   - Encrypted connections
   - Strong passwords
   - IP whitelisting
   - Regular backups
   - Role-based access

4. Wallet:
   - Never store private keys
   - Use Privy's secure enclave
   - Require signatures for sensitive actions
   - Display transaction details before signing
```

### Performance Optimization

```
1. Frontend:
   - Image optimization (Next.js Image)
   - Code splitting
   - Lazy loading components
   - React.memo for expensive components
   - Debounce API calls

2. API:
   - Redis caching for frequent reads
   - Database indexing
   - Connection pooling
   - Rate limiting
   - Response compression

3. Smart Contract:
   - Minimize compute units
   - Batch operations where possible
   - Use PDAs efficiently
   - Close unused accounts
```

### Monitoring & Analytics

```
1. Application Metrics:
   - PostHog for user analytics
   - Sentry for error tracking
   - Vercel analytics for performance
   - Custom dashboards

2. Business Metrics:
   - Daily active users
   - Transaction volume
   - Badge sales
   - Referral conversions
   - Revenue tracking

3. Alerts:
   - Smart contract errors
   - API downtime
   - Database issues
   - High error rates
```

---

## 🎉 SUMMARY

This document provides a complete end-to-end specification for building the **Whale Trading Suite** for the Solana Privacy Hack 2026.

### Key Features:
- ✅ Privacy-first trading tools
- ✅ NFT badge system with on-chain proof
- ✅ Affiliate monetization
- ✅ Mobile-first responsive design
- ✅ Dark cyberpunk theme (green/cyan)
- ✅ Privy wallet integration
- ✅ Mainnet ready
- ✅ Docker-based development
- ✅ Complete monorepo structure

### Tech Stack:
- Next.js 14 + TypeScript
- Anchor + Solana
- MongoDB + Mongoose
- Privy Auth
- Zustand State Management
- Tailwind CSS
- Docker + Docker Compose

### Timeline:
6 days of focused development → Production-ready platform

### Prize Target:
$10k-$25k across multiple bounties

---

**Ready to build! 🚀**

Let's create the best privacy platform for Solana whales! 🐋