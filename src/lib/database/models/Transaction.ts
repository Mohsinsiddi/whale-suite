import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionType =
  | 'privacy_deposit'
  | 'privacy_withdraw'
  | 'shadow_transfer'
  | 'pnp_bet'
  | 'jupiter_swap'
  | 'badge_purchase'
  | 'subscription_payment'
  | 'referral_payout'
  | 'card_order';

export type NetworkType = 'mainnet' | 'devnet';

// Category mapping for UI grouping
export const TRANSACTION_CATEGORIES = {
  privacy_deposit: 'privacy-cash',
  privacy_withdraw: 'privacy-cash',
  shadow_transfer: 'shadowwire',
  pnp_bet: 'pnp',
  jupiter_swap: 'swap',
  badge_purchase: 'badge',
  subscription_payment: 'subscription',
  referral_payout: 'referral',
  card_order: 'cards',
} as const;

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[TransactionType];

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export type SdkType = 'privacy-cash' | 'shadow-wire' | 'pnp' | 'jupiter';

export interface ITransaction extends Document {
  userId?: mongoose.Types.ObjectId;
  wallet: string;
  network: NetworkType;
  type: TransactionType;
  amount: number;
  token?: string;
  fee?: number;
  sdk?: SdkType;
  signature: string;
  slot?: number;
  blockTime?: number;
  status: TransactionStatus;
  errorMessage?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  confirmedAt?: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  wallet: {
    type: String,
    required: true,
    index: true
  },
  network: {
    type: String,
    enum: ['mainnet', 'devnet'],
    required: true,
    default: 'mainnet',
    index: true
  },
  type: {
    type: String,
    enum: [
      'privacy_deposit',
      'privacy_withdraw',
      'shadow_transfer',
      'pnp_bet',
      'jupiter_swap',
      'badge_purchase',
      'subscription_payment',
      'referral_payout',
      'card_order'
    ],
    required: true,
    index: true
  },
  amount: { type: Number, required: true },
  token: { type: String },
  fee: { type: Number },
  sdk: {
    type: String,
    enum: ['privacy-cash', 'shadow-wire', 'pnp', 'jupiter']
  },
  signature: {
    type: String,
    required: true,
    unique: true
  },
  slot: { type: Number },
  blockTime: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
    index: true
  },
  errorMessage: { type: String },
  metadata: { type: Map, of: Schema.Types.Mixed, default: {} },
  confirmedAt: { type: Date },
}, {
  timestamps: true,
});

// Compound indexes for common queries
TransactionSchema.index({ userId: 1, network: 1, createdAt: -1 });
TransactionSchema.index({ wallet: 1, network: 1, type: 1, createdAt: -1 });
TransactionSchema.index({ wallet: 1, network: 1, createdAt: -1 });
// Global activity API indexes
TransactionSchema.index({ status: 1, createdAt: -1 }); // Global feed sorted by time
TransactionSchema.index({ status: 1, type: 1, createdAt: -1 }); // Filtered global feed
TransactionSchema.index({ wallet: 1, status: 1 }); // User transaction counts

const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
