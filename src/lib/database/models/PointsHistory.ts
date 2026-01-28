import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Point action types and their base values
 */
export const POINT_VALUES = {
  privacy_deposit: 10,
  privacy_withdraw: 5,
  shadow_transfer: 25,
  standard_transfer: 5,
  jupiter_swap: 5, // per $100 volume
  card_order: 50,
  daily_login: 10,
  referral: 100,
  badge_bronze: 500,
  badge_silver: 1000,
  badge_gold: 2000,
  badge_diamond: 3500,
  badge_legendary: 5000,
  pnp_bet: 15,
} as const;

export type PointAction = keyof typeof POINT_VALUES;

/**
 * Badge multipliers for point earnings
 */
export const BADGE_MULTIPLIERS = {
  none: 1.0,
  bronze: 1.25,
  silver: 1.5,
  gold: 1.75,
  diamond: 2.0,
  legendary: 2.5,
} as const;

export type BadgeTier = keyof typeof BADGE_MULTIPLIERS;

export interface IPointsHistory extends Document {
  wallet: string;
  action: PointAction;
  basePoints: number;
  multiplier: number;
  totalPoints: number;
  badgeTier: BadgeTier;
  metadata?: {
    txSignature?: string;
    amount?: number;
    token?: string;
    description?: string;
    [key: string]: unknown;
  };
  createdAt: Date;
}

const PointsHistorySchema = new Schema<IPointsHistory>({
  wallet: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    enum: Object.keys(POINT_VALUES),
    index: true,
  },
  basePoints: {
    type: Number,
    required: true,
  },
  multiplier: {
    type: Number,
    required: true,
    default: 1.0,
  },
  totalPoints: {
    type: Number,
    required: true,
    index: true,
  },
  badgeTier: {
    type: String,
    enum: Object.keys(BADGE_MULTIPLIERS),
    default: 'none',
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Compound index for efficient querying
PointsHistorySchema.index({ wallet: 1, createdAt: -1 });
PointsHistorySchema.index({ createdAt: -1 });

/**
 * Calculate points for an action with badge multiplier
 */
export function calculatePoints(action: PointAction, badgeTier: BadgeTier, volumeMultiplier: number = 1): {
  basePoints: number;
  multiplier: number;
  totalPoints: number;
} {
  const basePoints = POINT_VALUES[action] * volumeMultiplier;
  const multiplier = BADGE_MULTIPLIERS[badgeTier];
  const totalPoints = Math.floor(basePoints * multiplier);

  return { basePoints, multiplier, totalPoints };
}

const PointsHistory: Model<IPointsHistory> =
  mongoose.models.PointsHistory || mongoose.model<IPointsHistory>('PointsHistory', PointsHistorySchema);

export default PointsHistory;
