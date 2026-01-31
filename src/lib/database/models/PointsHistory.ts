import mongoose, { Schema, Document, Model } from 'mongoose';

// Import from centralized points config
import {
  POINT_ACTIONS,
  BADGE_TIERS,
  calculatePoints as calcPoints,
  type PointAction,
  type BadgeTier,
} from '@/lib/points/config';

// Re-export for backwards compatibility
export type { PointAction, BadgeTier };

// Legacy exports - derive from new config for consistency
export const POINT_VALUES = Object.fromEntries(
  Object.entries(POINT_ACTIONS).map(([key, value]) => [key, value.basePoints])
) as Record<PointAction, number>;

export const BADGE_MULTIPLIERS = Object.fromEntries(
  Object.entries(BADGE_TIERS).map(([key, value]) => [key, value.multiplier])
) as Record<BadgeTier, number>;

// Re-export calculatePoints with same signature for backwards compatibility
export function calculatePoints(
  action: PointAction,
  badgeTier: BadgeTier,
  volumeMultiplier: number = 1
): {
  basePoints: number;
  multiplier: number;
  totalPoints: number;
} {
  const result = calcPoints(action, badgeTier, volumeMultiplier);
  return {
    basePoints: result.basePoints,
    multiplier: result.multiplier,
    totalPoints: result.totalPoints,
  };
}

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
    enum: Object.keys(POINT_ACTIONS),
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
    enum: Object.keys(BADGE_TIERS),
    default: 'none',
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Compound indexes for efficient querying
PointsHistorySchema.index({ wallet: 1, createdAt: -1 }); // User points history
PointsHistorySchema.index({ createdAt: -1 }); // Global recent activity
PointsHistorySchema.index({ wallet: 1, action: 1, createdAt: -1 }); // Action-specific queries

const PointsHistory: Model<IPointsHistory> =
  mongoose.models.PointsHistory || mongoose.model<IPointsHistory>('PointsHistory', PointsHistorySchema);

export default PointsHistory;
