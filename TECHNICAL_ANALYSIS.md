# 🔐 TECHNICAL ANALYSIS: PDAs vs Real Wallets for Shadow Vaults

## Critical Finding: PDAs CANNOT Use Privacy SDKs Directly

### The Problem

**PDAs (Program Derived Addresses) cannot sign transactions.**

All privacy SDKs require wallet signatures to:
- Generate ZK proofs
- Authorize deposits/withdrawals
- Sign transfer transactions

```
User Wallet (can sign) ──→ Privacy SDK ──→ Transaction
     ✅ WORKS

PDA (cannot sign) ──→ Privacy SDK ──→ ❌ FAILS
     ❌ PDAs don't have private keys
```

### Why PDAs Can't Sign

```rust
// PDAs are derived from seeds, no private key exists
let (pda, bump) = Pubkey::find_program_address(
    &[user.key().as_ref(), b"vault"],
    &program_id
);

// Only the PROGRAM can sign for PDAs using invoke_signed
invoke_signed(
    &instruction,
    accounts,
    &[&[user.key().as_ref(), b"vault", &[bump]]]  // Program signs
)?;
```

The program signs, not the user. Privacy SDKs expect USER signatures.

---

## SDK Status Report (January 2026)

| SDK | Status | npm Package | Can PDA Use? |
|-----|--------|-------------|--------------|
| **Elusiv** | ❌ DEPRECATED | `@elusiv/sdk` | N/A - Sunset Jan 2025 |
| **Privacy Cash** | ✅ ACTIVE | `privacycash` | ❌ Requires wallet signature |
| **ShadowWire** | ✅ ACTIVE | GitHub only | ❌ Requires wallet signature |
| **PNP Exchange** | ✅ ACTIVE | `pnp-sdk` | ❌ Requires wallet signature |
| **Jupiter** | ✅ ACTIVE | `@jup-ag/api` | ❌ Requires wallet signature |
| **Light Protocol** | ✅ ACTIVE | `@lightprotocol/stateless.js` | ❌ Requires wallet signature |
| **Token 2022 Confidential** | ✅ ACTIVE | `@solana-program/token-2022` | ⚠️ Partial (needs program CPI) |

### Key Updates from Original CLAUDE.md:

1. **Elusiv is DEAD** - Sunset in 2024, team now building Arcium
2. **Privacy Cash** is the replacement - Active, audited, mainnet ready
3. **ShadowWire** is real - Bulletproofs-based, GitHub only (no npm)
4. **PNP Exchange** - NOT anonymous! Just regular prediction markets
5. **Light Protocol** - Pivoted from privacy to ZK compression (cost savings)

---

## Solution: Derived Keypairs (NOT PDAs)

### Approach: Generate Deterministic Wallets

Instead of PDAs, generate **real keypairs** derived from user's main wallet signature.

```typescript
// User signs a message with their main wallet
const message = `Create Shadow Vault #${vaultNumber} for Whale Suite`;
const signature = await wallet.signMessage(Buffer.from(message));

// Derive a new keypair deterministically from the signature
const seed = sha256(signature).slice(0, 32);
const vaultKeypair = Keypair.fromSeed(seed);

// This is a REAL wallet that can sign!
console.log(vaultKeypair.publicKey.toBase58()); // Vault address
```

### How It Works

```
Main Wallet (User Controls)
    │
    │ Signs message: "Create Vault #1"
    ▼
┌─────────────────────────────────────┐
│  Deterministic Derivation           │
│  seed = SHA256(signature)           │
│  keypair = Keypair.fromSeed(seed)   │
└─────────────────────────────────────┘
    │
    ▼
Shadow Vault #1 (Real Wallet)
    - Has private key (derived)
    - Can sign transactions
    - Can use Privacy Cash
    - Can use ShadowWire
    - Can swap on Jupiter
```

### Benefits

| Feature | PDA Approach | Derived Keypair Approach |
|---------|--------------|-------------------------|
| Can sign transactions | ❌ No | ✅ Yes |
| Works with Privacy SDKs | ❌ No | ✅ Yes |
| Deterministic address | ✅ Yes | ✅ Yes |
| Recoverable from main wallet | ✅ Yes | ✅ Yes (re-sign same message) |
| Fully separate from main wallet | ⚠️ Linked on-chain | ✅ Completely separate |
| Privacy level | ❌ Low (PDA linked to main) | ✅ High (separate wallet) |

### Security Considerations

1. **Private keys stored in browser** - Use encryption + secure storage
2. **Recovery** - User can always recreate vault by signing same message
3. **Export option** - Allow users to export vault private keys
4. **Privy integration** - Can use Privy's secure enclave for key storage

---

## Alternative: Privy Embedded Wallets

Privy can create **multiple embedded wallets** per user:

```typescript
import { useCreateWallet, useWallets } from '@privy-io/react-auth';

// Create additional embedded wallets
const { createWallet } = useCreateWallet();

async function createShadowVault(name: string) {
  const wallet = await createWallet(); // Creates new embedded wallet

  // Store in database
  await saveVault({
    userId: user.id,
    name,
    address: wallet.address,
    privyWalletId: wallet.id,
  });

  return wallet;
}

// Get all user's wallets
const { wallets } = useWallets();
// wallets = [mainWallet, vault1, vault2, ...]
```

### Privy Embedded Wallet Benefits

| Feature | Benefit |
|---------|---------|
| Key Management | Privy handles secure storage |
| Recovery | Linked to user's Privy account |
| Signing | Full transaction signing capability |
| Cross-device | Works on any device user logs into |
| No seed phrase | Users don't manage keys |

---

## Recommended Architecture

### Option A: Privy Embedded Wallets (RECOMMENDED)

```
User (Privy Account)
    │
    ├── Connected Wallet (Phantom/Solflare) - "Command Center"
    │       └── For on-chain identity & badge ownership
    │
    ├── Embedded Wallet #1 - "Trading Alpha"
    │       └── Can sign, use Privacy Cash, swap
    │
    ├── Embedded Wallet #2 - "Cold Storage"
    │       └── Can sign, use Privacy Cash
    │
    └── Embedded Wallet #3 - "DeFi Ops"
            └── Can sign, swap on Jupiter
```

### Option B: Derived Keypairs (More Control)

```
User's Main Wallet
    │
    │ Signs derivation messages
    ▼
┌─────────────────────────────────────┐
│  Local Vault Manager                │
│  - Derives keypairs                 │
│  - Encrypts & stores in IndexedDB   │
│  - Provides signing for SDKs        │
└─────────────────────────────────────┘
    │
    ├── Vault #1 Keypair
    ├── Vault #2 Keypair
    └── Vault #3 Keypair
```

### Option C: Hybrid (Best of Both)

```
User (Privy Account)
    │
    ├── Main Wallet (Privy Embedded or External)
    │       └── Identity, badges, affiliates (on-chain data)
    │
    └── Shadow Vaults (Derived Keypairs)
            └── Privacy operations (completely separate)
```

**Why Hybrid?**
- Main wallet holds NFT badges (visible ownership proof)
- Shadow vaults are completely unlinked for true privacy
- Best privacy + verifiable identity when needed

---

## Updated Database Schema

Since we're not using PDAs, update the vault schema:

```typescript
interface Vault {
  _id: ObjectId;

  // Ownership
  userId: ObjectId;
  userMainWallet: string;           // User's main wallet address

  // Vault Identity
  vaultNumber: number;              // Sequential: 1, 2, 3...
  name: string;                     // User-defined: "Trading Alpha"

  // Wallet (NOT PDA)
  walletType: 'privy_embedded' | 'derived_keypair';
  address: string;                  // Vault's public address

  // For Privy Embedded
  privyWalletId?: string;           // Privy's wallet ID

  // For Derived Keypair
  derivation?: {
    messageHash: string;            // Hash of signed message
    encryptedPrivateKey?: string;   // Encrypted with user's key
    // Never store raw private key!
  };

  // Balances (same as before)
  balances: {
    sol: { public: number; darkPool: number; total: number; };
    tokens: Array<{...}>;
    totalUsd: number;
  };

  // ... rest of schema
}
```

---

## SDK Integration Code

### Privacy Cash (privacycash)

```typescript
import { PrivacyCash } from 'privacycash';
import { Connection, Keypair } from '@solana/web3.js';

class PrivacyCashService {
  private connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl);
  }

  // Deposit SOL to Dark Pool
  async deposit(vaultKeypair: Keypair, amount: number) {
    const privacyCash = new PrivacyCash(this.connection);

    // Vault keypair can sign!
    const tx = await privacyCash.deposit(amount, vaultKeypair);
    const signature = await this.connection.sendTransaction(tx, [vaultKeypair]);

    return signature;
  }

  // Withdraw from Dark Pool
  async withdraw(vaultKeypair: Keypair, amount: number, recipient: string) {
    const privacyCash = new PrivacyCash(this.connection);

    const tx = await privacyCash.withdraw(amount, recipient, vaultKeypair);
    const signature = await this.connection.sendTransaction(tx, [vaultKeypair]);

    return signature;
  }

  // Get hidden balance
  async getPrivateBalance(vaultKeypair: Keypair) {
    const privacyCash = new PrivacyCash(this.connection);
    return await privacyCash.getPrivateBalance(vaultKeypair.publicKey);
  }
}
```

### Jupiter Swap

```typescript
import { Jupiter } from '@jup-ag/core';

class JupiterService {
  async swap(
    vaultKeypair: Keypair,
    inputMint: string,
    outputMint: string,
    amount: number
  ) {
    const jupiter = await Jupiter.load({
      connection: this.connection,
      cluster: 'mainnet-beta',
      user: vaultKeypair.publicKey, // Vault's address
    });

    const routes = await jupiter.computeRoutes({
      inputMint: new PublicKey(inputMint),
      outputMint: new PublicKey(outputMint),
      amount,
      slippageBps: 50,
    });

    const { swapTransaction } = await jupiter.exchange({
      routeInfo: routes[0],
    });

    // Vault keypair signs the swap
    swapTransaction.sign([vaultKeypair]);
    const signature = await this.connection.sendRawTransaction(
      swapTransaction.serialize()
    );

    return signature;
  }
}
```

### Privy Embedded Wallet Usage

```typescript
import { useWallets, useSolanaWallets } from '@privy-io/react-auth';

function VaultActions({ vaultPrivyId }: { vaultPrivyId: string }) {
  const { wallets } = useSolanaWallets();

  // Find the specific vault wallet
  const vaultWallet = wallets.find(w => w.id === vaultPrivyId);

  async function depositToDarkPool(amount: number) {
    if (!vaultWallet) return;

    // Privy handles signing internally
    const tx = await buildPrivacyCashDepositTx(amount);
    const signedTx = await vaultWallet.signTransaction(tx);

    const signature = await connection.sendRawTransaction(signedTx.serialize());
    return signature;
  }

  return (
    <Button onClick={() => depositToDarkPool(10)}>
      Deposit 10 SOL to Dark Pool
    </Button>
  );
}
```

---

## Smart Contract Adjustments

Since we're using real wallets (not PDAs), the smart contract only needs to:

1. **Register user** - Link main wallet to user profile
2. **Mint badge NFT** - Send to user's main wallet
3. **Track subscription** - Store expiry in user account
4. **Verify ownership** - Check badge NFT ownership

The contract does NOT need to manage vault creation or operations - that's handled by the SDK integrations.

```rust
// Simplified contract - no vault PDAs needed

#[account]
pub struct UserAccount {
    pub user_number: u64,           // #999
    pub main_wallet: Pubkey,        // User's main wallet
    pub registered_at: i64,

    // Badge
    pub badge_tier: BadgeTier,
    pub badge_mint: Option<Pubkey>,
    pub badge_purchased_at: Option<i64>,

    // Subscription
    pub premium_expiry: i64,

    // Referral
    pub referral_code: [u8; 8],
    pub referred_by: Option<Pubkey>,

    pub bump: u8,
}

// Vault management is OFF-CHAIN
// Each vault is just a real wallet that user controls
// Database tracks which wallets belong to which user
```

---

## Final Architecture Decision

### RECOMMENDED: Privy Embedded Wallets

**Reasons:**
1. ✅ No private key management in our code
2. ✅ Secure storage by Privy
3. ✅ Cross-device wallet access
4. ✅ Full signing capability
5. ✅ Works with all privacy SDKs
6. ✅ Easy implementation
7. ✅ Recovery via Privy account

**Implementation:**
1. User connects main wallet (Phantom/Solflare)
2. User creates "Shadow Vault" → Privy creates embedded wallet
3. Vault can deposit to Privacy Cash, swap on Jupiter, etc.
4. All vaults linked to user's Privy account for recovery

---

## Deployment Status Summary

| Protocol | Mainnet | Devnet | npm Package |
|----------|---------|--------|-------------|
| Privacy Cash | ✅ | ✅ | `privacycash` |
| ShadowWire | ✅ | ✅ | GitHub: `radrdotfun/ShadowWire` |
| Jupiter | ✅ | ✅ | `@jup-ag/api` |
| PNP Exchange | ✅ | ✅ | `pnp-sdk` |
| Helius | ✅ | ✅ | `helius-sdk` |
| Light Protocol | ✅ | ✅ | `@lightprotocol/stateless.js` |

**Note:** Test on devnet first, then deploy to mainnet.

---

## Action Items

1. ✅ Update PLAN.md - Change "PDA-based" to "Embedded Wallet-based"
2. ✅ Use Privy embedded wallets for Shadow Vaults
3. ✅ Integrate `privacycash` instead of deprecated Elusiv
4. ✅ Clone ShadowWire from GitHub (no npm)
5. ✅ Update PNP description - it's NOT anonymous
6. ⚠️ PNP betting is public, not private - update UI copy

---

## Updated Vault Flow

```
1. User connects Phantom/Solflare → Main wallet
2. User clicks "Create Shadow Vault"
3. Privy creates new embedded wallet
4. Wallet address stored in MongoDB
5. User can now:
   - Receive SOL/tokens to vault
   - Deposit to Dark Pool (Privacy Cash)
   - Transfer anonymously (ShadowWire)
   - Swap tokens (Jupiter)
   - Place bets (PNP - public, not private)
6. Each vault is completely separate from main wallet
7. No on-chain link between vaults (true privacy)
```
