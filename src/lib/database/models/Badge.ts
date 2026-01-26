import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBadgeMetadata {
  name: string;
  image: string;
  attributes: Record<string, string | number>;
}

export interface IBadge extends Document {
  userId: mongoose.Types.ObjectId;
  wallet: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  mintAddress: string;
  purchasePrice: number;
  txSignature: string;
  status: 'active' | 'upgraded' | 'sold';
  metadata: IBadgeMetadata;
  purchasedAt: Date;
  createdAt: Date;
}

const BadgeMetadataSchema = new Schema<IBadgeMetadata>({
  name: { type: String, required: true },
  image: { type: String, required: true },
  attributes: { type: Map, of: Schema.Types.Mixed },
}, { _id: false });

const BadgeSchema = new Schema<IBadge>({
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
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'diamond', 'legendary'],
    required: true,
    index: true
  },
  mintAddress: {
    type: String,
    required: true,
    unique: true
  },
  purchasePrice: { type: Number, required: true },
  txSignature: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'upgraded', 'sold'],
    default: 'active'
  },
  metadata: { type: BadgeMetadataSchema, required: true },
  purchasedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

const Badge: Model<IBadge> = mongoose.models.Badge || mongoose.model<IBadge>('Badge', BadgeSchema);

export default Badge;
