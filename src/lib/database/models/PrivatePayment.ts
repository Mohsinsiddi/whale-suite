import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentStatus = 'active' | 'pending' | 'claimed' | 'cancelled' | 'expired';

export interface IPrivatePayment extends Document {
  // Payment reference
  paymentId: string;
  paymentAccountAddress: string;
  escrowAccountAddress: string;

  // Creator (only they know they created it)
  creatorWallet: string;

  // Amount in escrow (visible on-chain anyway)
  escrowAmount: number;

  // Status (synced from on-chain)
  status: PaymentStatus;

  // Timestamps
  expiresAt: Date;
  claimedAt?: Date;
  cancelledAt?: Date;

  // TX references
  createTxSignature: string;
  claimTxSignature?: string;
  finalizeTxSignature?: string;
  cancelTxSignature?: string;

  // Metadata
  memo?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PrivatePaymentSchema = new Schema<IPrivatePayment>({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  paymentAccountAddress: {
    type: String,
    required: true,
    index: true,
  },
  escrowAccountAddress: {
    type: String,
    required: true,
  },
  creatorWallet: {
    type: String,
    required: true,
    index: true,
  },
  escrowAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'claimed', 'cancelled', 'expired'],
    default: 'active',
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  claimedAt: Date,
  cancelledAt: Date,
  createTxSignature: {
    type: String,
    required: true,
  },
  claimTxSignature: String,
  finalizeTxSignature: String,
  cancelTxSignature: String,
  memo: String,
}, {
  timestamps: true,
});

// Compound indexes for fast queries
PrivatePaymentSchema.index({ creatorWallet: 1, status: 1, createdAt: -1 });
PrivatePaymentSchema.index({ status: 1, expiresAt: 1 });
PrivatePaymentSchema.index({ creatorWallet: 1, createdAt: -1 });

const PrivatePayment: Model<IPrivatePayment> =
  mongoose.models.PrivatePayment ||
  mongoose.model<IPrivatePayment>('PrivatePayment', PrivatePaymentSchema);

export default PrivatePayment;
