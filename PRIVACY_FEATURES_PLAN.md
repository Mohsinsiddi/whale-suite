# Privacy Features Integration Plan

> **Status:** VALIDATED & READY TO BUILD
> **Last Updated:** January 30, 2026

---

## Executive Summary

| Feature | SDK | Mainnet | Validated | Bounty Target |
|---------|-----|---------|-----------|---------------|
| **Private Swap** | `@darklakefi/ts-sdk-on-chain` | ✅ Yes | ✅ Yes | $10K (Arcium/Anoncoin) |
| **Private Launchpad** | `privacycash` + `@meteora-ag/dlmm` | ✅ Yes | ✅ Yes | $10K (Anoncoin) |
| **Private Transfer** | `@radr/shadowwire` | ✅ Yes | ✅ Done | $15K (Radr) |

**Total Bounty Potential: $35,000+**

---

## Feature 1: Private Swap (Darklake ZK-AMM)

### Overview

Darklake provides MEV-resistant swaps using Zero-Knowledge proofs. Trade intent (direction, size, slippage) is hidden until execution, preventing frontrunning and sandwich attacks.

### Technical Validation ✅

**SDK:** `@darklakefi/ts-sdk-on-chain@0.2.0`

```bash
pnpm add @darklakefi/ts-sdk-on-chain
```

**Dependencies included:**
- `@coral-xyz/anchor@0.30.1`
- `@solana/web3.js@1.87.6`
- `snarkjs@0.7.5` (ZK proofs)
- `circomlibjs@0.1.7` (circuits)

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    DARKLAKE PRIVATE SWAP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: Create Order (swapTx)                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • User specifies: inputToken, outputToken, amount        │   │
│  │ • SDK generates random salt for commitment               │   │
│  │ • Creates encrypted order on-chain                       │   │
│  │ • Returns: tx, orderKey, minOut, salt                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  STEP 2: Hidden from MEV Bots                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Order exists on-chain but details ENCRYPTED            │   │
│  │ • Bots cannot see: trade direction, size, slippage       │   │
│  │ • Frontrunning is IMPOSSIBLE                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  STEP 3: Settlement (finalizeTx)                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Groth16 ZK proof verifies trade validity               │   │
│  │ • Swap executes at committed parameters                  │   │
│  │ • User receives output tokens                            │   │
│  │ • Optional: unwrap WSOL to native SOL                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Privacy Guarantees

| What's Hidden | When | How |
|---------------|------|-----|
| Trade direction | Until settlement | Encrypted commitment |
| Trade size | Until settlement | ZK commitment |
| Slippage tolerance | Until settlement | Blind slippage |
| Trade intent | Until settlement | No mempool exposure |

### SDK API Reference

```typescript
import { DarklakeSDK, BN } from '@darklakefi/ts-sdk-on-chain';

// Initialize (mainnet)
const sdk = new DarklakeSDK(
  rpcUrl,           // Helius RPC
  'confirmed',      // Commitment
  false,            // isDevnet (false = mainnet)
  'whale-suite',    // App label (max 10 chars)
  'WHALE001'        // Ref code (max 20 chars)
);

// Execute private swap
const { tx, orderKey, minOut, salt } = await sdk.swapTx(
  inputMint,        // PublicKey - token to sell
  outputMint,       // PublicKey - token to buy
  amountIn,         // BN - amount in smallest units
  minAmountOut,     // BN - minimum acceptable output
  walletAddress     // PublicKey - user's wallet
);

// Finalize the swap
const { tx: finalizeTx } = await sdk.finalizeTx(
  orderKey,         // From swapTx result
  true,             // Unwrap WSOL to SOL
  minOut,           // From swapTx result
  salt              // From swapTx result
);

// Utility functions
await sdk.loadPool(tokenMintX, tokenMintY);  // Load pool data
await sdk.updateAccounts();                   // Refresh state
const order = await sdk.getOrder(wallet);     // Check order status
const [sortedX, sortedY] = sdk.sortTokens(mintA, mintB);  // Correct order
```

### Files to Create

```
src/lib/privacy-sdks/darklake.ts           # Service wrapper
src/hooks/useDarklake.ts                    # React hook
src/app/(dashboard)/private-swap/page.tsx  # UI page
```

### Implementation Tasks

- [ ] Install `@darklakefi/ts-sdk-on-chain`
- [ ] Create `darklake.ts` service with error handling
- [ ] Create `useDarklake.ts` hook with Privy wallet integration
- [ ] Build `/private-swap` page with:
  - [ ] Token selector (input/output)
  - [ ] Amount input with max button
  - [ ] Slippage settings
  - [ ] Privacy indicator badges
  - [ ] Two-step progress modal (Commit → Settle)
  - [ ] Success modal with Solscan link
- [ ] Add to sidebar navigation
- [ ] Test on mainnet with small amounts

### Estimated Time: 4 hours

---

## Feature 2: Private Launchpad (Privacy Cash + Meteora)

### Overview

A token launchpad where contributors fund anonymously. Uses Privacy Cash for anonymous contributions and Meteora DLMM for liquidity bootstrapping.

### Technical Validation ✅

**Privacy Cash SDK:** `privacycash@1.1.12`
```bash
npm install privacycash  # Requires Node.js 24+
```

**Meteora DLMM SDK:** `@meteora-ag/dlmm@1.9.3`
```bash
pnpm add @meteora-ag/dlmm
```

### Key Discovery: Withdraw to ANY Address

```typescript
// Privacy Cash allows withdrawal to ANY recipient
const result = await client.withdraw({
  lamports: 100_000_000,
  recipientAddress: 'ANY_WALLET_OR_POOL_ADDRESS'  // ✅ Key feature!
})
```

This enables anonymous contributions to a launchpad pool!

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIVATE LAUNCHPAD FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 1: Launch Setup (Creator)                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Define token: name, symbol, supply                     │   │
│  │ • Set funding goal (e.g., 100 SOL)                       │   │
│  │ • Set min/max contribution limits                        │   │
│  │ • Create escrow wallet for contributions                 │   │
│  │ • Set deadline                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  PHASE 2: Anonymous Funding (Contributors)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  User Wallet ──deposit()──→ Privacy Cash Pool            │   │
│  │       │                           │                      │   │
│  │       │                           ↓                      │   │
│  │       │              Returns: commitment (ZK proof)      │   │
│  │       │                           │                      │   │
│  │       │    withdraw(recipientAddress: ESCROW_WALLET)     │   │
│  │       │                           │                      │   │
│  │       ↓                           ↓                      │   │
│  │  [UNLINKED]              Escrow receives SOL             │   │
│  │                          (no link to user!)              │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  PHASE 3: Launch Execution                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ When funding goal reached:                               │   │
│  │ • Create SPL token                                       │   │
│  │ • Initialize Meteora DLMM pool                           │   │
│  │ • Add liquidity (raised SOL + tokens)                    │   │
│  │ • Enable trading                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  PHASE 4: Token Claims                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Contributors claim tokens:                               │   │
│  │ • Provide commitment from Phase 2                        │   │
│  │ • Prove contribution amount via ZK                       │   │
│  │ • Receive proportional tokens                            │   │
│  │ • Still no link to original wallet!                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Privacy Guarantees

| What's Hidden | How |
|---------------|-----|
| Contributor identity | Privacy Cash ZK pool breaks wallet link |
| Contribution amount | Only revealed during claim (to claimer) |
| Wallet address | Deposit and withdraw are unlinkable |
| Participation | No on-chain proof of who contributed |

### SDK API Reference

#### Privacy Cash

```typescript
import { PrivacyCash } from 'privacycash';

// Initialize
const client = new PrivacyCash({
  RPC_url: process.env.SOLANA_RPC_URL,
  owner: walletPrivateKey  // or use signTransaction callback
});

// Deposit SOL to privacy pool
const depositResult = await client.deposit({
  lamports: 1_000_000_000  // 1 SOL
});
// Returns: { tx: 'signature...' }

// Withdraw to ANY address (key for launchpad!)
const withdrawResult = await client.withdraw({
  lamports: 1_000_000_000,
  recipientAddress: 'LAUNCHPAD_ESCROW_ADDRESS'
});
// Returns: { tx: 'signature...', recipient: '...' }

// Check private balance
const balance = await client.getPrivateBalance();

// SPL tokens (USDC, USDT)
await client.depositSPL({ mint, lamports });
await client.withdrawSPL({ mint, lamports, recipientAddress });
```

#### Meteora DLMM

```typescript
import DLMM from '@meteora-ag/dlmm';

// Initialize pool
const dlmmPool = await DLMM.create(connection, poolAddress);

// Get pool info
const { tokenX, tokenY, activeId, binStep } = dlmmPool.lbPair;

// Add liquidity
const addLiquidityTx = await dlmmPool.addLiquidity({
  positionPubKey,
  totalXAmount,
  totalYAmount,
  // ... distribution params
});

// Create new pool (for token launch)
const createPoolTx = await DLMM.createPermissionlessLbPair(
  connection,
  binStep,
  tokenX,
  tokenY,
  activeId,
  feeOwner
);
```

### Files to Create

```
src/lib/privacy-sdks/privacy-cash.ts       # Privacy Cash service
src/lib/privacy-sdks/private-launchpad.ts  # Combined launchpad service
src/hooks/usePrivateLaunchpad.ts           # React hook
src/app/(dashboard)/launchpad/page.tsx     # UI page
```

### Implementation Tasks

- [ ] Install `privacycash` and `@meteora-ag/dlmm`
- [ ] Create `privacy-cash.ts` service
- [ ] Create `private-launchpad.ts` service
- [ ] Create `usePrivateLaunchpad.ts` hook
- [ ] Build `/launchpad` page with:
  - [ ] Active Launches tab (browse & contribute)
  - [ ] Create Launch tab (for creators)
  - [ ] My Contributions tab (track commitments)
  - [ ] Claim Tokens tab
- [ ] Add to sidebar navigation
- [ ] Test full flow on mainnet

### Estimated Time: 5 hours

---

## Implementation Order

### Phase 1: Private Swap (TODAY)
1. Install Darklake SDK
2. Create service + hook
3. Build UI page
4. Test on mainnet

### Phase 2: Private Launchpad (TOMORROW)
1. Install Privacy Cash + Meteora SDKs
2. Create services + hook
3. Build UI pages
4. Test full flow

---

## Bounty Targets

| Bounty | Prize | Feature | Status |
|--------|-------|---------|--------|
| Arcium - Confidential DeFi | $10,000 | Private Swap | 🔨 Building |
| Anoncoin - Best Overall | $5,000 | Private Launchpad | ⏳ Next |
| Anoncoin - Best Integration | $2,500 | Private Launchpad | ⏳ Next |
| Anoncoin - Most Creative | $2,500 | Private Launchpad | ⏳ Next |
| Radr - Grand Prize | $10,000 | Private Transfer | ✅ Done |
| Radr - USD1 Integration | $2,500 | Private Transfer | ✅ Done |
| Radr - Existing App | $2,500 | Private Transfer | ✅ Done |
| Private Payments Track | $15,000 | All Privacy Features | ✅ Done |

**Total Potential: $50,000+**

---

## Dependencies Summary

```json
{
  "dependencies": {
    "@darklakefi/ts-sdk-on-chain": "^0.2.0",
    "privacycash": "^1.1.12",
    "@meteora-ag/dlmm": "^1.9.3",
    "@radr/shadowwire": "already installed"
  }
}
```

---

## Resources

### Darklake
- Website: https://darklake.fi
- App: https://app.darklake.fi
- GitHub: https://github.com/darklakefi
- SDK: https://github.com/darklakefi/ts-sdk-on-chain

### Privacy Cash
- Docs: https://privacycash.mintlify.app
- GitHub: https://github.com/Privacy-Cash/privacy-cash-sdk
- npm: https://www.npmjs.com/package/privacycash

### Meteora
- Docs: https://docs.meteora.ag
- Launch Guide: https://launch.meteora.ag
- GitHub: https://github.com/MeteoraAg

---

*Plan validated and ready for implementation.*
