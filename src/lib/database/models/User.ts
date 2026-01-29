import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserStats {
  hiddenBalance: number;
  privateTransfers: number;
  anonymousBets: number;
  swapVolume: number;
  activeDays: number;
}

export interface IUserSettings {
  notifications: boolean;
  emailUpdates: boolean;
  language: string;
  theme: string;
}

export interface IUser extends Document {
  wallet: string;
  email?: string;
  privyId?: string;
  userNumber: number;
  badgeTier: 'none' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  badgeMint?: string;
  badgePurchasedAt?: Date;
  isPremium: boolean;
  premiumExpiry?: Date;
  privacyScore: number;
  stats: IUserStats;
  referralCode: string;
  referredBy?: string;
  settings: IUserSettings;
  // Points & Leaderboard
  points: number;
  streak: number;
  lastActiveDate?: Date;
  rank?: number;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

const UserStatsSchema = new Schema<IUserStats>({
  hiddenBalance: { type: Number, default: 0 },
  privateTransfers: { type: Number, default: 0 },
  anonymousBets: { type: Number, default: 0 },
  swapVolume: { type: Number, default: 0 },
  activeDays: { type: Number, default: 0 },
}, { _id: false });

const UserSettingsSchema = new Schema<IUserSettings>({
  notifications: { type: Boolean, default: true },
  emailUpdates: { type: Boolean, default: false },
  language: { type: String, default: 'en' },
  theme: { type: String, default: 'dark' },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  wallet: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: { type: String },
  privyId: { type: String },
  userNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  badgeTier: {
    type: String,
    enum: ['none', 'bronze', 'silver', 'gold', 'diamond', 'legendary'],
    default: 'none',
    index: true
  },
  badgeMint: { type: String },
  badgePurchasedAt: { type: Date },
  isPremium: { type: Boolean, default: false },
  premiumExpiry: { type: Date },
  privacyScore: { type: Number, default: 0, min: 0, max: 1000 },
  stats: { type: UserStatsSchema, default: () => ({}) },
  referralCode: {
    type: String,
    required: true,
    unique: true,
  },
  referredBy: { type: String },
  settings: { type: UserSettingsSchema, default: () => ({}) },
  // Points & Leaderboard
  points: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  rank: { type: Number },
  // Timestamps
  lastLoginAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Compound indexes for fast queries
UserSchema.index({ points: -1, streak: -1 }); // Leaderboard sorting (matches API sort)
UserSchema.index({ points: -1, createdAt: -1 }); // Leaderboard with time tiebreaker
UserSchema.index({ badgeTier: 1, points: -1 }); // Badge filtering + leaderboard
UserSchema.index({ privyId: 1 }, { sparse: true }); // Privy lookup (sparse for null values)
UserSchema.index({ lastActiveDate: 1, points: -1 }); // Period-based leaderboard queries

// Avoid model recompilation in dev mode
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
