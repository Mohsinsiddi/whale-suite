# Whale Suite - Points & Privacy Score System

> Complete guide to earning points and building your Stealth Rating

---

## Table of Contents

1. [Overview](#overview)
2. [Stealth Rating (Privacy Score)](#stealth-rating)
3. [Points System](#points-system)
4. [Feature Actions](#feature-actions)
5. [Badge Tiers](#badge-tiers)
6. [SDK Integrations](#sdk-integrations)
7. [Leaderboard](#leaderboard)
8. [Extending the System](#extending-the-system)

---

## Overview

Whale Suite has two interconnected reward systems:

| System | Range | Purpose |
|--------|-------|---------|
| **Stealth Rating** | 0-1000 | Measures your privacy level on-chain |
| **Points** | 0-∞ | Rewards platform engagement, used for leaderboard |

**Key Principle**: Privacy-focused actions earn BOTH higher points AND increase your Stealth Rating.

---

## Stealth Rating

Your **Stealth Rating** (also called Privacy Score) measures how "invisible" you are on the Solana blockchain. The higher your score, the more anonymous your trading behavior.

### Score Breakdown (Max 1000)

| Component | How It's Calculated | Max Points |
|-----------|---------------------|------------|
| **Hidden Balance** | 1 point per 0.1 SOL in Privacy Cash | 300 |
| **Private Transfers** | 5 points per ShadowWire/Darklake transfer | 250 |
| **Anonymous Bets** | 3 points per PNP prediction | 150 |
| **Swap Volume** | 1 point per 10 SOL traded | 100 |
| **Daily Streak** | 10 points per consecutive day | 100 |
| **Badge Bonus** | Based on badge tier | 100 |

### Badge Privacy Bonuses

| Badge | Privacy Bonus |
|-------|---------------|
| None | +0 |
| Bronze | +20 |
| Silver | +40 |
| Gold | +60 |
| Diamond | +80 |
| Legendary | +100 |

### Example Calculation

```
User with:
- 5 SOL hidden in Privacy Cash → 50 points
- 20 private transfers → 100 points
- 15 PNP bets → 45 points
- 100 SOL swapped → 10 points
- 5 day streak → 50 points
- Gold badge → 60 points

Total Stealth Rating: 315/1000
```

---

## Points System

Points reward you for using the platform and are multiplied by your badge tier.

### Point Multipliers by Badge

| Badge | Multiplier | Example (100 base points) |
|-------|------------|---------------------------|
| None | 1.0x | 100 points |
| Bronze | 1.25x | 125 points |
| Silver | 1.5x | 150 points |
| Gold | 1.75x | 175 points |
| Diamond | 2.0x | 200 points |
| Legendary | 2.5x | 250 points |

### Streak Bonus

Active on consecutive days? Get bonus points!

| Streak | Bonus |
|--------|-------|
| 1 day | +0% |
| 2 days | +5% |
| 3 days | +10% |
| 5 days | +25% |
| 7 days | +35% |
| 10+ days | +50% (max) |

---

## Feature Actions

### Privacy Cash (privacycash SDK)

Shield your SOL balance using zero-knowledge proofs.

| Action | Base Points | Privacy Weight | Description |
|--------|-------------|----------------|-------------|
| `privacy_deposit` | 15 | High (3) | Deposit SOL into vault |
| `privacy_withdraw` | 8 | Low (1) | Withdraw SOL from vault |

**Volume Bonus**: Points scale with SOL amount deposited.

**Example**:
- Deposit 10 SOL with Gold badge
- Base: 15 × 10 = 150 points
- With Gold (1.75x): **262 points**

---

### ShadowWire (radr/shadowwire SDK)

Private transfers with hidden amounts using Bulletproofs technology.

| Action | Base Points | Privacy Weight | Description |
|--------|-------------|----------------|-------------|
| `shadow_transfer` | 25 | Maximum (5) | Send private transfer |
| `standard_transfer` | 5 | Low (1) | Standard transfer via ShadowWire |
| `multi_send` | 30 | High (4) | Send to multiple recipients |

**Multi-Send Bonus**: +5 points per additional recipient.

---

### Darklake (darklake SDK)

Zero-knowledge private swaps with hidden trade amounts.

| Action | Base Points | Privacy Weight | Description |
|--------|-------------|----------------|-------------|
| `darklake_swap` | 35 | Maximum (5) | Execute private swap |
| `darklake_provide_liquidity` | 50 | High (3) | Provide LP to dark pool |

**Why Higher Points?** Darklake swaps are completely private - neither amount nor direction is visible on-chain.

---

### Jupiter (jupiter SDK)

Best swap rates via aggregator. Note: These are PUBLIC transactions.

| Action | Base Points | Privacy Weight | Description |
|--------|-------------|----------------|-------------|
| `jupiter_swap` | 5 | None (0) | Swap tokens via Jupiter |

**Volume Bonus**: 1 point per $100 swapped.

**Privacy Note**: Jupiter swaps are public and visible on-chain. Use Darklake for private swaps.

---

### PNP Exchange (pnp-sdk)

Anonymous prediction markets.

| Action | Base Points | Privacy Weight | Description |
|--------|-------------|----------------|-------------|
| `pnp_bet` | 20 | Medium (3) | Place anonymous prediction |
| `pnp_create_market` | 100 | Medium (2) | Create new prediction market |
| `pnp_claim_winnings` | 10 | Low (1) | Claim winnings |

**Cooldown**: Creating markets has a 24-hour cooldown.

---

### Anoncoin (Token Launcher)

Gasless anonymous token creation on Solana mainnet.

| Action | Base Points | Privacy Weight | Description |
|--------|-------------|----------------|-------------|
| `token_launch` | 200 | High (4) | Launch anonymous token |

**Features**:
- No gas fees required
- Identity never linked to token
- Instant DEX listing
- 1-hour cooldown between launches

---

### Starpay (Virtual Cards)

Anonymous virtual cards for crypto spending.

| Action | Base Points | Privacy Weight | Description |
|--------|-------------|----------------|-------------|
| `card_order` | 75 | High (4) | Order new virtual card |
| `card_topup` | 15 | Medium (2) | Top up card balance |

---

### Engagement Actions

Platform engagement rewards.

| Action | Base Points | Description |
|--------|-------------|-------------|
| `daily_login` | 10 | First action each day |
| `referral` | 100 | New user signs up with your code |
| `referral_purchase` | 250 | Referred user makes a purchase |

---

## Badge Tiers

One-time NFT purchases that permanently boost your earnings.

| Badge | Price (SOL) | Multiplier | Affiliate Rate | Benefits |
|-------|-------------|------------|----------------|----------|
| **Bronze Ghost** | 0.5 | 1.25x | 5% | +20 privacy bonus |
| **Silver Shadow** | 2 | 1.5x | 10% | +40 privacy bonus |
| **Gold Phantom** | 5 | 1.75x | 15% | +60 privacy bonus, custom themes |
| **Diamond Whale** | 10 | 2.0x | 20% | +80 privacy bonus, whale club |
| **Legendary Titan** | 25 | 2.5x | 25% | +100 privacy bonus, 1% revenue share |

---

## SDK Integrations

Whale Suite integrates with the best privacy infrastructure on Solana:

### Privacy-Focused SDKs

| SDK | Privacy Level | Bounty | Features |
|-----|---------------|--------|----------|
| **Privacy Cash** | High | $2,500 | ZK balance hiding |
| **ShadowWire** | High | Yes | Bulletproof transfers |
| **Darklake** | Maximum | Yes | ZK private swaps |
| **Anoncoin** | High | $10,000 | Gasless token launch |
| **Starpay** | High | $3,500 | Anonymous virtual cards |
| **PNP Exchange** | Medium | Yes | Anonymous predictions |

### Infrastructure SDKs

| SDK | Role | Bounty |
|-----|------|--------|
| **Helius** | RPC & whale tracking | Sponsor |
| **Light Protocol** | ZK compression | Main Sponsor |
| **Jupiter** | Swap aggregation | Ecosystem |

---

## Leaderboard

Compete for the top spots on the Whale Suite leaderboard!

### Ranking Factors

1. **Total Points** (primary)
2. **Streak** (tiebreaker)
3. **Registration Date** (final tiebreaker)

### Percentile Tiers

| Rank | Status |
|------|--------|
| Top 10 | Elite Whale |
| Top 100 | Whale |
| Top 10% | Rising Whale |
| Top 50% | Active |

---

## Extending the System

The points system is designed to easily accommodate new SDK integrations.

### Adding a New SDK

1. Add SDK to `SDK_REGISTRY` in `/lib/points/config.ts`:

```typescript
newSdk: {
  name: 'New SDK',
  description: 'What it does',
  website: 'https://...',
  bounty: 'Amount or Yes/No',
  features: ['feature1', 'feature2'],
  privacyLevel: 'high' | 'medium' | 'low' | 'none',
}
```

2. Add actions to `POINT_ACTIONS`:

```typescript
new_sdk_action: {
  basePoints: 20,
  category: 'new-sdk',
  sdk: 'newSdk',
  description: 'What this action does',
  privacyWeight: 3, // 0-5
  volumeMultiplier: true, // Scale with amount?
  cooldown: 0, // Milliseconds
}
```

3. Update the API to handle the new action type.

### Privacy Weight Guidelines

| Weight | Description | Example |
|--------|-------------|---------|
| 0 | Public transaction | Jupiter swap |
| 1 | Minimal privacy | Standard transfer |
| 2 | Some privacy | Card topup |
| 3 | Good privacy | PNP bet, Privacy deposit |
| 4 | High privacy | Token launch, Multi-send |
| 5 | Maximum privacy | Shadow transfer, Darklake swap |

---

## API Reference

### Award Points

```http
POST /api/points/award
Authorization: Bearer <privy-token>

{
  "action": "shadow_transfer",
  "volumeMultiplier": 1,
  "metadata": {
    "txSignature": "...",
    "amount": 5.0,
    "token": "SOL"
  }
}
```

### Get User Stats

```http
GET /api/users/{wallet}/stats
```

Response includes:
- `privacyScore` - Current Stealth Rating
- `points.total` - Total points earned
- `leaderboard.rank` - Current ranking
- `streak.current` - Day streak

---

## FAQ

**Q: Do points expire?**
A: No, points are permanent once earned.

**Q: Can I lose Stealth Rating?**
A: Yes, if you withdraw from Privacy Cash, your hidden balance decreases.

**Q: What's the fastest way to increase Stealth Rating?**
A: Use Darklake for private swaps and keep SOL in Privacy Cash.

**Q: Do public Jupiter swaps hurt my privacy?**
A: They don't decrease your score, but they don't increase it either. Use Darklake for privacy.

**Q: How often is the leaderboard updated?**
A: In real-time with each action.

---

*Last updated: January 2026*
*Whale Suite - Solana Privacy Hack 2026*
