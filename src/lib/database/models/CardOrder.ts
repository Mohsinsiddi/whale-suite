import mongoose, { Schema, Document } from 'mongoose';

/**
 * CardOrder - Simplified schema
 * Just stores orderId, fetch full details from StarPay API
 */
export interface ICardOrder extends Document {
  wallet: string;
  orderId: string;
  network: 'mainnet' | 'devnet';
  // Cached for quick display (fetched from API on creation)
  cardType?: 'visa' | 'mastercard';
  amount?: number;
  // Track payment
  txSignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CardOrderSchema = new Schema<ICardOrder>(
  {
    wallet: { type: String, required: true, lowercase: true },
    orderId: { type: String, required: true },
    network: {
      type: String,
      enum: ['mainnet', 'devnet'],
      required: true,
      default: 'mainnet',
    },
    cardType: { type: String, enum: ['visa', 'mastercard'] },
    amount: { type: Number },
    txSignature: { type: String },
  },
  { timestamps: true }
);

// Indexes - per network for proper data separation
CardOrderSchema.index({ wallet: 1, network: 1, createdAt: -1 });
CardOrderSchema.index({ orderId: 1, network: 1 }, { unique: true });

export default mongoose.models.CardOrder || mongoose.model<ICardOrder>('CardOrder', CardOrderSchema);
