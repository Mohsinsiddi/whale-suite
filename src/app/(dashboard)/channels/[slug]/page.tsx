'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/privy/hooks';
import { useConfidentialBadge } from '@/hooks/useConfidentialBadge';
import Link from 'next/link';

type ActivityType = 'swap' | 'transfer' | 'deposit' | 'withdraw' | 'bet' | 'badge_claim';

interface ActivityData {
  type: ActivityType;
  token?: string;
  amount?: number;
  fromToken?: string;
  toToken?: string;
  txSignature?: string;
  description?: string;
}

interface Message {
  id: string;
  content: string;
  contentType: 'text' | 'image' | 'link' | 'activity';
  activityData?: ActivityData;
  senderAnonId: string;
  senderWallet: string;
  createdAt: string;
  isEdited: boolean;
  isPinned: boolean;
  reactions: Record<string, string[]>;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
  tier: number;
  tierName: string;
  icon: string;
  memberCount: number;
  messageCount: number;
}

interface Membership {
  anonId: string;
  joinedAt: string;
  notifications: boolean;
}

export default function ChannelChatPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { wallet, walletAddress } = useAuth();
  useConfidentialBadge(); // Hook for badge context

  const [channel, setChannel] = useState<Channel | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch channel data
  const fetchChannel = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const res = await fetch(`/api/channels/${slug}?wallet=${walletAddress}`);
      const data = await res.json();

      if (data.success) {
        setChannel(data.channel);
        setMembership(data.membership);
        setMessages(data.messages);
        setPinnedMessages(data.pinnedMessages);
        setCanAccess(data.canAccess);
      }
    } catch (error) {
      console.error('Failed to fetch channel:', error);
    } finally {
      setLoading(false);
    }
  }, [slug, walletAddress]);

  // Poll for new messages
  const pollMessages = useCallback(async () => {
    if (!walletAddress || !membership) return;

    try {
      const res = await fetch(`/api/channels/${slug}/messages?wallet=${walletAddress}&limit=20`);
      const data = await res.json();

      if (data.success && data.messages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = data.messages.filter((m: Message) => !existingIds.has(m.id));
          if (newMessages.length > 0) {
            return [...prev, ...newMessages];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to poll messages:', error);
    }
  }, [slug, walletAddress, membership]);

  useEffect(() => {
    fetchChannel();
  }, [fetchChannel]);

  // Setup polling
  useEffect(() => {
    if (membership) {
      pollingRef.current = setInterval(pollMessages, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [membership, pollMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !walletAddress || !newMessage.trim() || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      // Sign message
      let signature = '';
      if (wallet && 'signMessage' in wallet) {
        const messageToSign = `Send message: ${content.slice(0, 50)}`;
        const messageBytes = new TextEncoder().encode(messageToSign);
        const signedBytes = await (wallet as unknown as { signMessage: (msg: Uint8Array) => Promise<Uint8Array> }).signMessage(messageBytes);
        signature = Buffer.from(signedBytes).toString('base64');
      }

      const res = await fetch(`/api/channels/${slug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          content,
          contentType: 'text',
          signature,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          ...data.message,
          senderWallet: walletAddress,
          reactions: {},
        }]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(content); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  // Handle sharing activity
  const handleShareActivity = async (activityData: Message['activityData']) => {
    if (!wallet || !walletAddress || sending) return;

    setSending(true);

    try {
      let signature = '';
      if (wallet && 'signMessage' in wallet) {
        const messageToSign = `Share activity: ${activityData?.type}`;
        const messageBytes = new TextEncoder().encode(messageToSign);
        const signedBytes = await (wallet as unknown as { signMessage: (msg: Uint8Array) => Promise<Uint8Array> }).signMessage(messageBytes);
        signature = Buffer.from(signedBytes).toString('base64');
      }

      const res = await fetch(`/api/channels/${slug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          content: activityData?.description || `Shared a ${activityData?.type}`,
          contentType: 'activity',
          activityData,
          signature,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          ...data.message,
          senderWallet: walletAddress,
          reactions: {},
        }]);
      }
    } catch (error) {
      console.error('Failed to share activity:', error);
    } finally {
      setSending(false);
    }
  };

  // Render loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full" />
      </div>
    );
  }

  // Render no access
  if (!channel || !canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Access Denied</h2>
          <p className="text-text-muted mb-4">
            {channel ? `Requires ${channel.tierName}+ badge` : 'Channel not found'}
          </p>
          <Link
            href="/channels"
            className="px-6 py-2 rounded-lg bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-colors"
          >
            Back to Channels
          </Link>
        </div>
      </div>
    );
  }

  // Render not a member - join flow
  if (!membership) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">{channel.icon}</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">{channel.name}</h2>
          <p className="text-text-secondary mb-6">{channel.description}</p>
          <button
            onClick={() => router.push('/channels')}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary font-bold hover:shadow-glow-md transition-all"
          >
            Join Channel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border-primary bg-bg-secondary/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/channels"
              className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              <BackIcon className="w-5 h-5 text-text-muted" />
            </Link>
            <span className="text-2xl">{channel.icon}</span>
            <div>
              <h1 className="text-lg font-bold text-text-primary">{channel.name}</h1>
              <p className="text-xs text-text-muted">
                {channel.memberCount} members • You are {membership.anonId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPinned(!showPinned)}
              className={`p-2 rounded-lg transition-colors ${
                showPinned ? 'bg-neon-green/10 text-neon-green' : 'hover:bg-bg-tertiary text-text-muted'
              }`}
            >
              <PinIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`p-2 rounded-lg transition-colors ${
                showMembers ? 'bg-neon-green/10 text-neon-green' : 'hover:bg-bg-tertiary text-text-muted'
              }`}
            >
              <UsersIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pinned Messages */}
        <AnimatePresence>
          {showPinned && pinnedMessages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-border-secondary overflow-hidden"
            >
              <p className="text-xs text-text-muted mb-2">📌 Pinned Messages</p>
              <div className="space-y-2">
                {pinnedMessages.map(msg => (
                  <div key={msg.id} className="p-2 rounded-lg bg-bg-tertiary text-sm">
                    <span className="text-neon-cyan">{msg.senderAnonId}</span>:{' '}
                    <span className="text-text-secondary">{msg.content}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-text-muted">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.senderWallet === walletAddress;
            const showAvatar = index === 0 || messages[index - 1]?.senderAnonId !== msg.senderAnonId;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                {showAvatar ? (
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    isOwn ? 'bg-neon-green text-bg-primary' : 'bg-bg-tertiary text-text-primary'
                  }`}>
                    {msg.senderAnonId.slice(-2)}
                  </div>
                ) : (
                  <div className="w-8" />
                )}

                {/* Message Content */}
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  {showAvatar && (
                    <p className={`text-xs text-text-muted mb-1 ${isOwn ? 'text-right' : ''}`}>
                      {msg.senderAnonId}
                    </p>
                  )}

                  {/* Activity Widget */}
                  {msg.contentType === 'activity' && msg.activityData && (
                    <div className={`p-3 rounded-xl border ${
                      isOwn ? 'bg-neon-green/10 border-neon-green/30' : 'bg-bg-tertiary border-border-primary'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {msg.activityData.type === 'swap' && '🔄'}
                          {msg.activityData.type === 'transfer' && '💸'}
                          {msg.activityData.type === 'deposit' && '📥'}
                          {msg.activityData.type === 'withdraw' && '📤'}
                          {msg.activityData.type === 'bet' && '🎲'}
                          {msg.activityData.type === 'badge_claim' && '🏆'}
                        </span>
                        <span className="font-medium text-text-primary capitalize">
                          {msg.activityData.type}
                        </span>
                      </div>
                      {msg.activityData.amount && (
                        <p className="text-sm text-text-secondary">
                          {msg.activityData.type === 'swap' ? (
                            <>Swapped {msg.activityData.amount} {msg.activityData.fromToken} → {msg.activityData.toToken}</>
                          ) : (
                            <>{msg.activityData.amount} {msg.activityData.token || 'SOL'}</>
                          )}
                        </p>
                      )}
                      {msg.activityData.txSignature && (
                        <a
                          href={`https://solscan.io/tx/${msg.activityData.txSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-neon-cyan hover:underline mt-2 inline-block"
                        >
                          View on Solscan →
                        </a>
                      )}
                    </div>
                  )}

                  {/* Text Message */}
                  {msg.contentType === 'text' && (
                    <div className={`p-3 rounded-2xl ${
                      isOwn
                        ? 'bg-neon-green text-bg-primary rounded-tr-sm'
                        : 'bg-bg-tertiary text-text-primary rounded-tl-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className={`text-[10px] text-text-muted mt-1 ${isOwn ? 'text-right' : ''}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.isEdited && ' (edited)'}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Activity Buttons */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-border-secondary bg-bg-secondary/30">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-text-muted whitespace-nowrap">Share:</span>
          {[
            { type: 'swap', icon: '🔄', label: 'Swap' },
            { type: 'transfer', icon: '💸', label: 'Transfer' },
            { type: 'deposit', icon: '📥', label: 'Deposit' },
            { type: 'bet', icon: '🎲', label: 'Bet' },
          ].map(activity => (
            <button
              key={activity.type}
              onClick={() => handleShareActivity({
                type: activity.type as ActivityType,
                description: `Shared a ${activity.type} activity`,
              })}
              disabled={sending}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-bg-tertiary hover:bg-bg-elevated border border-border-secondary text-xs text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
            >
              <span>{activity.icon}</span>
              <span>{activity.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex-shrink-0 p-4 border-t border-border-primary bg-bg-secondary">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder={`Message as ${membership.anonId}...`}
            disabled={sending}
            className="flex-1 px-4 py-3 rounded-xl bg-bg-tertiary border border-border-primary text-text-primary placeholder-text-muted focus:border-neon-green focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 rounded-xl bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-sm transition-all"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <SendIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Icons
const BackIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const PinIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const SendIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);
