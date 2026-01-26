# Whale Trading Suite

Privacy-First Trading Platform for Solana Whales | Solana Privacy Hack 2026

## Project Status

### Completed Features

| Feature | Status | Description |
|---------|--------|-------------|
| Privacy Cash Integration | **COMPLETE** | Deposit & Withdraw SOL to/from shielded ZK pool |
| Jupiter Swap Integration | **COMPLETE** | Token swaps with best routes via Jupiter aggregator |
| Helius Token Balances | **COMPLETE** | Fetch all wallet token balances via Helius API |
| ZK Proof Generation | **COMPLETE** | WASM-based proof generation with Light Protocol |
| Privy Wallet Integration | **COMPLETE** | Sign messages & transactions with Privy |
| Balance Validation | **COMPLETE** | Lamports-based validation (no floating point issues) |
| Error Handling | **COMPLETE** | User-friendly error messages for common issues |
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

## 2. Jupiter Swap Integration (Ultra API)

Successfully integrated Jupiter Ultra API for token swaps:

- **Ultra API**: Uses Jupiter's new Ultra API with automatic priority fees & transaction landing
- **Token Selection**: SOL, USDC, USDT, BONK, JUP + any tokens in user's wallet
- **Best Routes**: Jupiter finds optimal swap routes across all Solana DEXs
- **Real-time Quotes**: Price quotes update as you type (500ms debounce)
- **Slippage Control**: 0.1%, 0.5%, 1.0% options
- **Price Impact Warning**: Highlights high impact swaps
- **Wallet Token Display**: Shows all tokens in user's wallet with balances
- **Token Search**: Search token metadata via Jupiter Search API

**Flow:**
1. Get Order (`/ultra/v1/order`) - Returns transaction to sign
2. Sign with Privy wallet
3. Execute via Jupiter (`/ultra/v1/execute`) - Jupiter handles landing

**Key Files:**
- `src/lib/privacy-sdks/jupiter.ts` - Jupiter Ultra API service
- `src/hooks/useSwap.ts` - React hook with Privy signing
- `src/app/(dashboard)/swap/page.tsx` - Jupiter Swap UI (public swaps)

---

## 3. Helius Integration

Helius API integration for:

- **SOL Balance**: Real-time SOL balance fetching
- **Token Balances**: All SPL tokens in wallet with metadata
- **Transaction History**: Parsed transaction history
- **Auto-refresh**: Balances refresh every 30 seconds

**Key Files:**
- `src/lib/privacy-sdks/helius.ts` - Helius API service
- `src/hooks/useHelius.ts` - React hooks for balances, transactions, whale feed

---

## Technical Implementation

```
src/
├── lib/privacy-sdks/
│   ├── privacy-cash.ts      # Privacy Cash (ZK deposits/withdrawals)
│   ├── jupiter.ts           # Jupiter (token swaps)
│   ├── helius.ts            # Helius (balances, transactions)
│   └── index.ts             # Barrel exports
├── hooks/
│   ├── usePrivacyCash.ts    # Privacy Cash hook
│   ├── useSwap.ts           # Jupiter swap hook
│   └── useHelius.ts         # Helius data hooks
└── app/(dashboard)/
    ├── privacy/page.tsx     # Shield/Unshield UI
    └── swap/page.tsx        # Token swap UI
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

### Jupiter Swap (Public)
1. **Quote Debouncing**: Quotes fetch after 500ms typing delay
2. **Slippage**: Default 0.5%, adjustable (handled by Ultra API)
3. **SOL Reserve**: MAX button leaves 0.01 SOL for fees
4. **API Key Required**: Jupiter Ultra API requires an API key
5. **Public Transactions**: All Jupiter swaps are visible on-chain (Private Swap coming soon)

---

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Wallet**: Privy (embedded + external wallets)
- **Privacy**: Privacy Cash SDK, Light Protocol WASM
- **Swaps**: Jupiter Aggregator API
- **Data**: Helius Enhanced API
- **Database**: MongoDB with Mongoose
- **State**: Zustand + SWR

---

## Hackathon Targets

| Bounty | Amount | Status |
|--------|--------|--------|
| Privacy Cash Integration | $15,000 | **COMPLETE** |
| Jupiter Integration | - | **COMPLETE** |
| Helius Integration | - | **COMPLETE** |
