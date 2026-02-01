import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChannel extends Document {
  // Channel info
  name: string;
  slug: string;
  description: string;
  tier: number;
  tierName: string;
  icon: string;

  // Stats
  memberCount: number;
  messageCount: number;

  // Settings
  isActive: boolean;
  isDefault: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema = new Schema<IChannel>({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  description: {
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
  icon: {
    type: String,
    default: '💬',
  },
  memberCount: {
    type: Number,
    default: 0,
  },
  messageCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound indexes
ChannelSchema.index({ tier: 1, isActive: 1 });
ChannelSchema.index({ isDefault: 1, tier: 1 });

const Channel: Model<IChannel> =
  mongoose.models.Channel ||
  mongoose.model<IChannel>('Channel', ChannelSchema);

export default Channel;

// Default channels to seed
export const DEFAULT_CHANNELS = [
  {
    name: 'Bronze Lounge',
    slug: 'bronze-lounge',
    description: 'Welcome to the Bronze tier! Connect with fellow whales starting their privacy journey.',
    tier: 1,
    tierName: 'Bronze',
    icon: '🥉',
    isDefault: true,
  },
  {
    name: 'Silver Circle',
    slug: 'silver-circle',
    description: 'Exclusive discussions for Silver badge holders. Share strategies and insights.',
    tier: 2,
    tierName: 'Silver',
    icon: '🥈',
    isDefault: true,
  },
  {
    name: 'Gold Vault',
    slug: 'gold-vault',
    description: 'Premium channel for Gold members. Alpha leaks and whale coordination.',
    tier: 3,
    tierName: 'Gold',
    icon: '🥇',
    isDefault: true,
  },
  {
    name: 'Diamond Den',
    slug: 'diamond-den',
    description: 'Elite discussions for Diamond whales. High-stakes coordination and OTC deals.',
    tier: 4,
    tierName: 'Diamond',
    icon: '💎',
    isDefault: true,
  },
  {
    name: 'Legendary Council',
    slug: 'legendary-council',
    description: 'The inner circle. Legendary whales only. Market-moving discussions.',
    tier: 5,
    tierName: 'Legendary',
    icon: '👑',
    isDefault: true,
  },
];
