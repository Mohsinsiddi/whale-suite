import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IChannelMembership extends Document {
  // References
  wallet: string;
  channelId: Types.ObjectId;

  // Anonymous identity
  anonId: string;

  // Verification
  verifiedAt: Date;
  verificationSignature: string;

  // Status
  isActive: boolean;
  isMuted: boolean;
  joinedAt: Date;
  lastSeenAt: Date;

  // Notification preferences
  notifications: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ChannelMembershipSchema = new Schema<IChannelMembership>({
  wallet: {
    type: String,
    required: true,
    index: true,
  },
  channelId: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true,
  },
  anonId: {
    type: String,
    required: true,
    index: true,
  },
  verifiedAt: {
    type: Date,
    default: Date.now,
  },
  verificationSignature: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isMuted: {
    type: Boolean,
    default: false,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  lastSeenAt: {
    type: Date,
    default: Date.now,
  },
  notifications: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Unique constraint on wallet + channel
ChannelMembershipSchema.index({ wallet: 1, channelId: 1 }, { unique: true });

// Compound indexes for fast queries
ChannelMembershipSchema.index({ channelId: 1, isActive: 1 });
ChannelMembershipSchema.index({ wallet: 1, isActive: 1 });
ChannelMembershipSchema.index({ channelId: 1, lastSeenAt: -1 });

// Helper to generate anonymous ID
export function generateAnonId(): string {
  const chars = '0123456789ABCDEF';
  let result = 'Whale#';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const ChannelMembership: Model<IChannelMembership> =
  mongoose.models.ChannelMembership ||
  mongoose.model<IChannelMembership>('ChannelMembership', ChannelMembershipSchema);

export default ChannelMembership;
