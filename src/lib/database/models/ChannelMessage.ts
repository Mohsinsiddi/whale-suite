import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type MessageContentType = 'text' | 'image' | 'link' | 'activity';

export interface IActivityData {
  type: 'swap' | 'transfer' | 'deposit' | 'withdraw' | 'bet' | 'badge_claim';
  token?: string;
  amount?: number;
  fromToken?: string;
  toToken?: string;
  txSignature?: string;
  description?: string;
}

export interface IChannelMessage extends Document {
  // References
  channelId: Types.ObjectId;
  membershipId: Types.ObjectId;

  // Content
  content: string;
  contentType: MessageContentType;

  // Activity data (for activity widgets)
  activityData?: IActivityData;

  // Sender (anonymous)
  senderAnonId: string;
  senderWallet: string;

  // Reactions
  reactions: Map<string, string[]>;

  // Reply
  replyTo?: Types.ObjectId;

  // Status
  isDeleted: boolean;
  isEdited: boolean;
  isPinned: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ActivityDataSchema = new Schema<IActivityData>({
  type: {
    type: String,
    enum: ['swap', 'transfer', 'deposit', 'withdraw', 'bet', 'badge_claim'],
    required: true,
  },
  token: String,
  amount: Number,
  fromToken: String,
  toToken: String,
  txSignature: String,
  description: String,
}, { _id: false });

const ChannelMessageSchema = new Schema<IChannelMessage>({
  channelId: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true,
  },
  membershipId: {
    type: Schema.Types.ObjectId,
    ref: 'ChannelMembership',
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'link', 'activity'],
    default: 'text',
  },
  activityData: {
    type: ActivityDataSchema,
  },
  senderAnonId: {
    type: String,
    required: true,
  },
  senderWallet: {
    type: String,
    required: true,
    index: true,
  },
  reactions: {
    type: Map,
    of: [String],
    default: new Map(),
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'ChannelMessage',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for message queries
ChannelMessageSchema.index({ channelId: 1, createdAt: -1 });
ChannelMessageSchema.index({ channelId: 1, isPinned: 1, createdAt: -1 });
ChannelMessageSchema.index({ senderWallet: 1, createdAt: -1 });
ChannelMessageSchema.index({ channelId: 1, contentType: 1, createdAt: -1 });

const ChannelMessage: Model<IChannelMessage> =
  mongoose.models.ChannelMessage ||
  mongoose.model<IChannelMessage>('ChannelMessage', ChannelMessageSchema);

export default ChannelMessage;
