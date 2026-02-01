import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProofHandles {
  bronze: string;
  silver: string;
  gold: string;
  diamond: string;
  legendary: string;
}

export interface IConfidentialBadge extends Document {
  // User reference
  wallet: string;

  // On-chain reference
  badgeAccountAddress: string;
  claimTxSignature: string;

  // Badge data (cached from on-chain)
  tier: number;
  tierName: string;
  amountPaid: number;

  // INCO handles (for verification)
  encryptedTierHandle: string;
  proofHandles: IProofHandles;

  // Status
  isActive: boolean;
  claimedAt: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ProofHandlesSchema = new Schema<IProofHandles>({
  bronze: { type: String, required: true },
  silver: { type: String, required: true },
  gold: { type: String, required: true },
  diamond: { type: String, required: true },
  legendary: { type: String, required: true },
}, { _id: false });

const ConfidentialBadgeSchema = new Schema<IConfidentialBadge>({
  wallet: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  badgeAccountAddress: {
    type: String,
    required: true,
    index: true,
  },
  claimTxSignature: {
    type: String,
    required: true,
  },
  tier: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true,
  },
  tierName: {
    type: String,
    required: true,
    enum: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Legendary'],
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  encryptedTierHandle: {
    type: String,
    required: true,
  },
  proofHandles: {
    type: ProofHandlesSchema,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  claimedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound indexes for fast queries
ConfidentialBadgeSchema.index({ wallet: 1, isActive: 1 });
ConfidentialBadgeSchema.index({ tier: 1, isActive: 1 });

const ConfidentialBadge: Model<IConfidentialBadge> =
  mongoose.models.ConfidentialBadge ||
  mongoose.model<IConfidentialBadge>('ConfidentialBadge', ConfidentialBadgeSchema);

export default ConfidentialBadge;
