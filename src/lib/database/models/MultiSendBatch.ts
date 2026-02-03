import mongoose, { Schema, Document, Model } from 'mongoose';

export type MultiSendStatus = 'pending' | 'in_progress' | 'completed' | 'partial' | 'failed';
export type TokenType = 'SOL' | 'USDC' | 'USDT' | 'USD1' | 'BONK' | 'WIF' | 'JUP' | 'JTO' | 'RADR' | 'WLFI' | 'WSOL';

export interface IMultiSendRecipient {
  address: string;
  amount: number;
  usdValue: number;
  status: 'pending' | 'success' | 'failed';
  signature?: string;
  error?: string;
  completedAt?: Date;
}

export interface IMultiSendBatch extends Document {
  userId?: mongoose.Types.ObjectId;
  wallet: string;
  network: 'mainnet' | 'devnet';

  // Token info
  token: TokenType;
  tokenMint?: string;
  tokenPrice: number;

  // Transfer details
  transferType: 'internal' | 'external'; // ShadowWire type
  recipients: IMultiSendRecipient[];

  // Totals
  totalAmount: number;
  totalUsdValue: number;
  totalFee: number;
  recipientCount: number;

  // Progress
  status: MultiSendStatus;
  completedCount: number;
  failedCount: number;
  currentIndex: number;

  // Timestamps
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MultiSendRecipientSchema = new Schema({
  address: { type: String, required: true },
  amount: { type: Number, required: true },
  usdValue: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  signature: { type: String },
  error: { type: String },
  completedAt: { type: Date },
}, { _id: false });

const MultiSendBatchSchema = new Schema<IMultiSendBatch>({
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
    default: 'mainnet'
  },

  // Token info
  token: {
    type: String,
    enum: ['SOL', 'USDC', 'USDT', 'USD1', 'BONK', 'WIF', 'JUP', 'JTO', 'RADR', 'WLFI', 'WSOL'],
    required: true,
    default: 'SOL'
  },
  tokenMint: { type: String },
  tokenPrice: { type: Number, required: true },

  // Transfer details
  transferType: {
    type: String,
    enum: ['internal', 'external'],
    required: true,
    default: 'internal'
  },
  recipients: [MultiSendRecipientSchema],

  // Totals
  totalAmount: { type: Number, required: true },
  totalUsdValue: { type: Number, required: true },
  totalFee: { type: Number, default: 0 },
  recipientCount: { type: Number, required: true },

  // Progress
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'partial', 'failed'],
    default: 'pending',
    index: true
  },
  completedCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  currentIndex: { type: Number, default: 0 },

  // Timestamps
  startedAt: { type: Date },
  completedAt: { type: Date },
}, {
  timestamps: true,
});

// Indexes
MultiSendBatchSchema.index({ wallet: 1, createdAt: -1 });
MultiSendBatchSchema.index({ wallet: 1, status: 1 });
MultiSendBatchSchema.index({ status: 1, createdAt: -1 });

const MultiSendBatch: Model<IMultiSendBatch> = mongoose.models.MultiSendBatch || mongoose.model<IMultiSendBatch>('MultiSendBatch', MultiSendBatchSchema);

export default MultiSendBatch;
