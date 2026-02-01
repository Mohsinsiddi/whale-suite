import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFollow extends Document {
  // Who is following
  followerWallet: string;

  // Who is being followed
  followingWallet: string;

  // Status
  isActive: boolean;

  // Notification preferences
  notifyOnActivity: boolean;
  notifyOnMessage: boolean;

  // Timestamps
  followedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FollowSchema = new Schema<IFollow>({
  followerWallet: {
    type: String,
    required: true,
    index: true,
  },
  followingWallet: {
    type: String,
    required: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  notifyOnActivity: {
    type: Boolean,
    default: true,
  },
  notifyOnMessage: {
    type: Boolean,
    default: false,
  },
  followedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Unique constraint - can only follow once
FollowSchema.index({ followerWallet: 1, followingWallet: 1 }, { unique: true });

// Compound indexes for fast queries
FollowSchema.index({ followerWallet: 1, isActive: 1 });
FollowSchema.index({ followingWallet: 1, isActive: 1 });
FollowSchema.index({ followerWallet: 1, isActive: 1, followedAt: -1 });

const Follow: Model<IFollow> =
  mongoose.models.Follow ||
  mongoose.model<IFollow>('Follow', FollowSchema);

export default Follow;

// Helper functions
export async function getFollowerCount(wallet: string): Promise<number> {
  return Follow.countDocuments({ followingWallet: wallet, isActive: true });
}

export async function getFollowingCount(wallet: string): Promise<number> {
  return Follow.countDocuments({ followerWallet: wallet, isActive: true });
}

export async function isFollowing(followerWallet: string, followingWallet: string): Promise<boolean> {
  const follow = await Follow.findOne({
    followerWallet,
    followingWallet,
    isActive: true,
  });
  return !!follow;
}
