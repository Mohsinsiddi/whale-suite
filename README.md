# Whale Trading Suite

Privacy-First Trading Platform for Solana Whales | Solana Privacy Hack 2026

## Project Status

### Completed Features

| Feature | Status | Description |
|---------|--------|-------------|
| Privacy Cash Integration | **COMPLETE** | Deposit & Withdraw SOL to/from shielded ZK pool |
| ShadowWire Integration | **COMPLETE** | Bulletproof ZK private transfers ($15k bounty) |
| PNP Exchange Integration | **COMPLETE** | Prediction markets with anonymous betting ($2.5k bounty) |
| Jupiter Swap Integration | **COMPLETE** | Token swaps with best routes via Jupiter aggregator |
| Helius Token Balances | **COMPLETE** | Fetch all wallet token balances via Helius API |
| ZK Proof Generation | **COMPLETE** | WASM-based proof generation with Light Protocol |
| Privy Wallet Integration | **COMPLETE** | Sign messages & transactions with Privy |
| Balance Validation | **COMPLETE** | Lamports-based validation (no floating point issues) |
| Error Handling | **COMPLETE** | User-friendly error messages for common issues |
| Enhanced Transaction Modals | **COMPLETE** | Animated progress with ZK proof indicators |
| Enhanced Sidebar | **COMPLETE** | Section grouping, bounty badges, stealth rating |
| UI/UX | **COMPLETE** | Dark cyberpunk theme with responsive design |

---

## 1. Privacy Cash SDK Integration

Successfully integrated `privacycash` SDK v1.1.11 for:

- **Deposit (Shield)**: Transfer SOL from public wallet to private shielded pool
  - No protocol fees
  - ZK proof generation (~10-15 seconds)
  - Relayer submission to indexer backend

- **Withdraw (Unshield)**: Transfer SOL from private pool back to public wallet
  - Relay fee: ~0.006 SOL
  - ZK proof generation
  - Supports custom recipient addresses

**Key Files:**
- `src/lib/privacy-sdks/privacy-cash.ts` - SDK wrapper
- `src/hooks/usePrivacyCash.ts` - React hook with Privy integration
- `src/app/(dashboard)/privacy/page.tsx` - Privacy Cash UI

---

## 2. ShadowWire SDK Integration ($15k Bounty)

Successfully integrated `@radr/shadowwire` SDK for private transfers on Solana:

- **Deposit to Pool**: Transfer SOL from public wallet to shielded pool
  - Minimum: 0.1 SOL (anti-spam)
  - Balance reflects in 30-60 seconds

- **Withdraw from Pool**: Transfer SOL from shielded pool back to public wallet
  - Minimum: 0.1 SOL
  - SDK handles transaction signing and submission

- **Internal Transfer** (Hidden Amount):
  - Amount hidden via Bulletproof zero-knowledge proofs
  - Both sender and recipient visible
  - ZK proof generation takes 30-45 seconds

- **External Transfer** (Anonymous Sender):
  - Sender identity hidden
  - Recipient receives SOL from pool without knowing sender

**Key Files:**
- `src/lib/privacy-sdks/shadow-wire.ts` - ShadowWire SDK wrapper
- `src/hooks/useShadowWire.ts` - React hook with Privy integration
- `src/app/(dashboard)/transfer/page.tsx` - Ghost Send UI

---

## 3. Jupiter Swap Integration (Swap API v1)

Successfully integrated Jupiter Swap API v1 for token swaps:

- **Swap API v1**: Uses Jupiter's Swap API with dynamic priority fees & slippage
- **Token Selection**: SOL, USDC, USDT, BONK, JUP + any tokens in user's wallet
- **Best Routes**: Jupiter finds optimal swap routes across all Solana DEXs
- **Real-time Quotes**: Price quotes update as you type (500ms debounce)
- **Slippage Control**: 0.1%, 0.5%, 1.0% options
- **Price Impact Warning**: Highlights high impact swaps
- **Wallet Token Display**: Shows all tokens in user's wallet with balances
- **Dynamic Decimals**: Fetches token decimals from blockchain for accurate conversions
- **Optimistic Updates**: Balance updates instantly after swap, syncs with RPC
- **Header Balance Sync**: Global store triggers header balance refresh

**Flow:**
1. Get Quote (`/swap/v1/quote`) - Returns quote with route info
2. Get Swap Transaction (`/swap/v1/swap`) - Returns transaction to sign
3. Sign with Privy wallet
4. Send to network & confirm
5. Optimistic balance update + RPC sync

**Key Files:**
- `src/lib/privacy-sdks/jupiter.ts` - Jupiter Swap API v1 service
- `src/hooks/useSwap.ts` - React hook with Privy signing
- `src/hooks/useHelius.ts` - Balance hooks with optimistic updates
- `src/app/(dashboard)/swap/page.tsx` - Jupiter Swap UI (public swaps)

---

## 4. PNP Exchange Integration ($2.5k Bounty)

Successfully integrated `pnp-sdk` v0.2.8 for prediction markets:

- **Market Listing**: Fetch all active prediction markets
- **Real-time Prices**: YES/NO token prices calculated from supply
- **Market Metadata**: Volume, liquidity, end dates via batch API
- **Trading Interface**: Buy YES/NO tokens modal with price estimates
- **Position Tracking**: View user positions per market
- **Status Filtering**: Filter by Active, Ended, Resolved markets
- **Auto-refresh**: Markets refresh every 30 seconds

**Key Features:**
- Anonymous betting (wallet address not revealed to other users)
- USDC-based trading
- Real-time price updates
- Loading skeletons for better UX

**Key Files:**
- `src/lib/privacy-sdks/pnp.ts` - PNP SDK service wrapper
- `src/hooks/usePNP.ts` - React hook with trading functions
- `src/app/(dashboard)/markets/page.tsx` - Prediction Markets UI

---

## 5. Helius Integration

Helius API + Direct RPC integration for:

- **SOL Balance**: Real-time SOL balance fetching via RPC
- **Token Balances**: All SPL tokens in wallet with metadata
- **RPC Balance Fetch**: Direct RPC for real-time balances (no indexing delay)
- **Token Metadata**: Fetches decimals, symbols from Helius DAS API with RPC fallback
- **Transaction History**: Parsed transaction history via Helius Enhanced API
- **Auto-refresh**: Balances refresh every 30 seconds
- **Optimistic Updates**: Instant UI updates after swaps
- **Global Refresh Trigger**: Zustand store triggers balance refresh across components

**Key Files:**
- `src/lib/privacy-sdks/helius.ts` - Helius API + RPC service
- `src/hooks/useHelius.ts` - React hooks for balances, transactions, whale feed
- `src/hooks/useWalletBalance.ts` - Header balance hook with store integration
- `src/store/slices/wallet.ts` - Global wallet state with refresh trigger

---

## Technical Implementation

```
src/
├── lib/privacy-sdks/
│   ├── privacy-cash.ts      # Privacy Cash (ZK deposits/withdrawals)
│   ├── shadow-wire.ts       # ShadowWire (Bulletproof ZK transfers)
│   ├── pnp.ts               # PNP Exchange (prediction markets)
│   ├── jupiter.ts           # Jupiter Swap API v1 (token swaps)
│   ├── helius.ts            # Helius API + RPC (balances, metadata)
│   └── index.ts             # Barrel exports
├── hooks/
│   ├── usePrivacyCash.ts    # Privacy Cash hook with Privy signing
│   ├── useShadowWire.ts     # ShadowWire hook with Privy signing
│   ├── usePNP.ts            # PNP Exchange hook with trading
│   ├── useSwap.ts           # Jupiter swap hook with Privy signing
│   ├── useHelius.ts         # Helius data hooks (optimistic updates)
│   └── useWalletBalance.ts  # Header balance hook (store integration)
├── components/
│   ├── ui/
│   │   └── Modal.tsx        # TransactionModal + SuccessModal (enhanced)
│   └── layout/
│       ├── Sidebar.tsx      # Enhanced sidebar with section grouping
│       └── DashboardLayout  # Loading skeleton, responsive layout
├── store/
│   ├── index.ts             # Zustand store with all slices
│   └── slices/
│       ├── wallet.ts        # Wallet state + balance refresh trigger
│       ├── auth.ts          # Auth state
│       ├── user.ts          # User profile state
│       └── ui.ts            # UI state (modals, sidebar)
└── app/(dashboard)/
    ├── privacy/page.tsx     # Shield/Unshield UI (Privacy Cash)
    ├── transfer/page.tsx    # Ghost Send UI (ShadowWire)
    ├── markets/page.tsx     # Prediction Markets UI (PNP Exchange)
    ├── swap/page.tsx        # Token swap UI (Jupiter)
    └── dashboard/page.tsx   # Command center with pool stats
```

---

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

```env
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_JUPITER_API_KEY=your_jupiter_api_key
MONGODB_URI=mongodb://localhost:27017/whale-suite
```

Get Jupiter API key at: https://portal.jup.ag

---

## Known Behaviors

### Privacy Cash
1. **ZK Proof Time**: Proof generation takes 10-15 seconds
2. **Transaction Expiry**: If proof takes too long, retry
3. **Minimum Balances**:
   - Min deposit: 0.001 SOL
   - Min withdrawal: 0.007 SOL (must be > relay fee)

### ShadowWire (Private Transfers)
1. **Minimum Amount**: 0.1 SOL for all operations (deposit, withdraw, transfer)
2. **ZK Proof Time**: Bulletproof proof generation takes 30-45 seconds
3. **Balance Delay**: Pool balance may take 30-60 seconds to reflect
4. **Internal Transfer**: Amount hidden via ZK proof, both parties visible
5. **External Transfer**: Sender anonymous, recipient receives from pool
6. **Fees**: ~0.1% protocol fee calculated by SDK

### Jupiter Swap (Public)
1. **Quote Debouncing**: Quotes fetch after 500ms typing delay
2. **Slippage**: Default 0.5%, adjustable (0.1%, 0.5%, 1.0%)
3. **SOL Reserve**: MAX button leaves 0.01 SOL for fees
4. **API Key Optional**: Jupiter Swap API works without key, but rate-limited
5. **Dynamic Decimals**: Token decimals fetched from blockchain (no hardcoded values)
6. **Instant Balance Updates**: Optimistic update + RPC sync after 2 seconds
7. **Header Sync**: Global store triggers header balance refresh
8. **Public Transactions**: All Jupiter swaps are visible on-chain (Private Swap coming soon)

### PNP Exchange (Prediction Markets)
1. **Auto-refresh**: Markets refresh every 30 seconds
2. **Price Calculation**: YES/NO prices derived from token supply ratios
3. **USDC Trading**: All trades denominated in USDC
4. **Market Status**: Active, Ended, or Resolved states
5. **Volume Display**: Total volume fetched from PNP metadata API
6. **Anonymous Betting**: Wallet addresses not exposed to other users
7. **Loading Skeletons**: Smooth loading states while fetching markets

---

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Wallet**: Privy (embedded + external wallets)
- **Privacy**:
  - Privacy Cash SDK (shield/unshield)
  - ShadowWire SDK (Bulletproof ZK transfers)
  - Light Protocol WASM
- **Markets**: PNP SDK v0.2.8 (prediction markets)
- **Swaps**: Jupiter Aggregator API
- **Data**: Helius Enhanced API
- **Database**: MongoDB with Mongoose
- **State**: Zustand + SWR

---

## Hackathon Targets

| Bounty | Amount | Status |
|--------|--------|--------|
| ShadowWire Integration (Radr Labs) | $15,000 | **COMPLETE** |
| Privacy Cash Integration | $15,000 | **COMPLETE** |
| PNP Exchange Integration | $2,500 | **COMPLETE** |
| Jupiter Integration | - | **COMPLETE** |
| Helius Integration | - | **COMPLETE** |
| Light Protocol | TBD | Pending |
| Anoncoin | $10,000 | Pending |

**Total Bounty Potential: $32,500+**
