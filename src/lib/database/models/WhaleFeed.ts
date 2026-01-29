import mongoose, { Schema, Document, Model } from 'mongoose';

export type WhaleFeedEventType =
  | 'large_transfer'
  | 'privacy_deposit'
  | 'privacy_withdraw'
  | 'token_swap'
  | 'anonymous_bet';

export interface IWhaleFeed extends Document {
  whaleId: string;
  walletHash: string;
  eventType: WhaleFeedEventType;
  amount?: number;
  token?: string;
  usdValue?: number;
  signature: string;
  slot?: number;
  blockTime: number;
  displayText: string;
  createdAt: Date;
}

const WhaleFeedSchema = new Schema<IWhaleFeed>({
  whaleId: {
    type: String,
    required: true,
    index: true
  },
  walletHash: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: [
      'large_transfer',
      'privacy_deposit',
      'privacy_withdraw',
      'token_swap',
      'anonymous_bet'
    ],
    required: true,
    index: true
  },
  amount: { type: Number },
  token: { type: String, default: 'SOL' },
  usdValue: { type: Number },
  signature: {
    type: String,
    required: true,
    unique: true
  },
  slot: { type: Number },
  blockTime: {
    type: Number,
    required: true,
    index: true
  },
  displayText: { type: String, required: true },
}, {
  timestamps: true,
});

// Compound indexes for feed queries
WhaleFeedSchema.index({ createdAt: -1 }); // Default time sort
WhaleFeedSchema.index({ blockTime: -1 }); // Block time sort
WhaleFeedSchema.index({ eventType: 1, blockTime: -1 }); // Filtered time queries

const WhaleFeed: Model<IWhaleFeed> = mongoose.models.WhaleFeed || mongoose.model<IWhaleFeed>('WhaleFeed', WhaleFeedSchema);

export default WhaleFeed;
