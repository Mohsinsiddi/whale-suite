import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionType =
  | 'privacy_deposit'
  | 'privacy_withdraw'
  | 'shadow_transfer'
  | 'pnp_bet'
  | 'jupiter_swap'
  | 'badge_purchase'
  | 'subscription_payment'
  | 'referral_payout';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export type SdkType = 'privacy-cash' | 'shadow-wire' | 'pnp' | 'jupiter';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  wallet: string;
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
    required: true,
    index: true
  },
  wallet: {
    type: String,
    required: true,
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
      'referral_payout'
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
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ wallet: 1, type: 1, createdAt: -1 });

const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
