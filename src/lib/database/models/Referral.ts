import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBadgePurchaseConversion {
  tier: string;
  amount: number;
  commission: number;
  date: Date;
}

export interface ISubscriptionConversion {
  months: number;
  amount: number;
  commission: number;
  date: Date;
}

export interface IConversions {
  badgePurchase?: IBadgePurchaseConversion;
  subscriptions: ISubscriptionConversion[];
}

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId;
  referrerWallet: string;
  referredUserId: mongoose.Types.ObjectId;
  referredUserWallet: string;
  commissionRate: number;
  totalEarned: number;
  pendingPayout: number;
  paidOut: number;
  conversions: IConversions;
  status: 'active' | 'inactive';
  referredAt: Date;
  lastEarningAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BadgePurchaseConversionSchema = new Schema<IBadgePurchaseConversion>({
  tier: { type: String, required: true },
  amount: { type: Number, required: true },
  commission: { type: Number, required: true },
  date: { type: Date, required: true },
}, { _id: false });

const SubscriptionConversionSchema = new Schema<ISubscriptionConversion>({
  months: { type: Number, required: true },
  amount: { type: Number, required: true },
  commission: { type: Number, required: true },
  date: { type: Date, required: true },
}, { _id: false });

const ConversionsSchema = new Schema<IConversions>({
  badgePurchase: { type: BadgePurchaseConversionSchema },
  subscriptions: { type: [SubscriptionConversionSchema], default: [] },
}, { _id: false });

const ReferralSchema = new Schema<IReferral>({
  referrerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  referrerWallet: {
    type: String,
    required: true,
    index: true
  },
  referredUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  referredUserWallet: {
    type: String,
    required: true
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalEarned: { type: Number, default: 0 },
  pendingPayout: { type: Number, default: 0 },
  paidOut: { type: Number, default: 0 },
  conversions: { type: ConversionsSchema, default: () => ({ subscriptions: [] }) },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  },
  referredAt: { type: Date, default: Date.now },
  lastEarningAt: { type: Date },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
ReferralSchema.index({ referrerWallet: 1, status: 1, createdAt: -1 }); // Referrer's active referrals
ReferralSchema.index({ referrerWallet: 1, totalEarned: -1 }); // Earnings leaderboard
ReferralSchema.index({ status: 1, pendingPayout: -1 }); // Pending payouts query
ReferralSchema.index({ referredAt: -1 }); // Recent referrals

const Referral: Model<IReferral> = mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);

export default Referral;
