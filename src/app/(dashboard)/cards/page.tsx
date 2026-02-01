'use client';

/**
 * StarPay Virtual Cards Page
 * Unified Payment Modal with QR/Wallet toggle
 * Integrates with card-orders API for order persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useSignTransaction } from '@privy-io/react-auth/solana';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { QRCodeSVG } from 'qrcode.react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SuccessModal } from '@/components/ui/Modal';
import VirtualCard3D from '@/components/cards/VirtualCard3D';
import { useStarPay, CardType } from '@/hooks/useStarPay';
import { useNetwork } from '@/hooks/useNetwork';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useToast } from '@/components/ui/Toast';
import { ActivityTable, ActivityItem } from '@/components/activity/ActivityTable';
import {
  CreditCard,
  Sparkles,
  Shield,
  Zap,
  Globe,
  Copy,
  Check,
  ArrowRight,
  Wallet,
  Mail,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  QrCode as QrCodeIcon,
  Send,
  ExternalLink,
  X,
  Timer,
} from 'lucide-react';

// Simplified order from DB (just orderId, fetch details from API)
interface SavedCardOrder {
  _id: string;
  orderId: string;
  cardType?: 'visa' | 'mastercard';
  amount?: number;
  txSignature?: string;
  createdAt: string;
}

const CARD_AMOUNTS = [5, 25, 50, 100, 250];

// Feature Card
function FeatureCard({ icon: Icon, title, description }: {
  icon: typeof CreditCard;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-bg-elevated/50 border border-border-primary/50">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-neon-green" />
      </div>
      <div>
        <h4 className="font-medium text-text-primary text-sm">{title}</h4>
        <p className="text-text-muted text-xs mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();
  const { network, rpcUrl } = useNetwork();
  const { isAuthenticated, walletAddress, login } = useRequireAuth();
  const { post, get } = useAuthenticatedFetch();
  const toast = useToast();

  const primaryWallet = wallets?.[0];
  const { balance } = useWalletBalance(primaryWallet?.address || null);

  const {
    loading,
    error,
    priceData: priceQuote,
    currentOrder,
    orderStatus,
    getPrice,
    createCard,
    checkOrderStatus,
    resumeOrder,
    pollOrder,
    stopPolling,
    isPolling,
    reset,
  } = useStarPay();

  // Form state
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [cardType, setCardType] = useState<CardType>('mastercard');
  const [cardholderName, setCardholderName] = useState('');
  const [email, setEmail] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false });

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'qr' | 'wallet'>('qr');
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string | null>(null);

  // Wallet transaction state
  const [sending, setSending] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Order history state
  const [savedOrders, setSavedOrders] = useState<SavedCardOrder[]>([]);
  const [orderDetails, setOrderDetails] = useState<Map<string, { status: string; amount?: number }>>(new Map());
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Get email from Privy
  useEffect(() => {
    if (user?.email?.address) setEmail(user.email.address);
  }, [user]);

  // Fetch saved orders on mount
  const fetchSavedOrders = useCallback(async () => {
    if (!isAuthenticated || !walletAddress) return;

    setLoadingOrders(true);
    try {
      const response = await get<{ orders: SavedCardOrder[] }>(`/api/card-orders?network=${network}`);
      if (response.data?.orders) {
        setSavedOrders(response.data.orders);

        // Fetch status for each order from StarPay API
        const details = new Map<string, { status: string; amount?: number }>();
        for (const order of response.data.orders.slice(0, 10)) {
          try {
            const status = await checkOrderStatus(order.orderId);
            if (status) {
              details.set(order.orderId, {
                status: status.status,
                amount: status.amountUSD || order.amount,
              });
            }
          } catch {
            // Use cached data if API fails
            details.set(order.orderId, { status: 'unknown', amount: order.amount });
          }
        }
        setOrderDetails(details);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [isAuthenticated, walletAddress, network, get, checkOrderStatus]);

  useEffect(() => {
    fetchSavedOrders();
  }, [fetchSavedOrders]);

  // Save order to DB (just orderId and basic info)
  const saveOrderToDB = useCallback(async (order: {
    orderId: string;
    cardType: CardType;
    amount: number;
  }) => {
    if (!isAuthenticated) return;

    try {
      await post('/api/card-orders', { ...order, network });
      fetchSavedOrders(); // Refresh the list
    } catch (err) {
      console.error('Failed to save order:', err);
    }
  }, [isAuthenticated, network, post, fetchSavedOrders]);

  // Expiration countdown
  useEffect(() => {
    const expiresAt = currentOrder?.expiresAt;
    if (!expiresAt) {
      setExpiresIn(null);
      return;
    }

    const updateCountdown = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setExpiresIn('Expired');
        return;
      }
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setExpiresIn(`${min}:${sec.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentOrder?.expiresAt]);

  // Fetch price
  useEffect(() => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (amount >= 5 && amount <= 10000) {
      getPrice(amount);
    }
  }, [selectedAmount, customAmount, getPrice]);

  // Close modal on success
  useEffect(() => {
    if (orderStatus?.status === 'issued') {
      toast.success('Card Issued!', `Your card details have been sent to ${email}`);
      setTimeout(() => {
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        fetchSavedOrders(); // Refresh orders
      }, 1000);
    }
  }, [orderStatus?.status, email, toast, fetchSavedOrders]);

  const actualAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidName = cardholderName.trim().length >= 2;
  const isValidAmount = actualAmount >= 5 && actualAmount <= 10000;
  const canSubmit = isValidEmail && isValidName && isValidAmount;

  // Get payment info from order
  const paymentAddress = currentOrder?.payment?.address;
  const paymentAmount = currentOrder?.payment?.amountSol;
  const cardValue = currentOrder?.pricing?.cardValue || actualAmount;
  const totalUSD = currentOrder?.pricing?.total;

  // Create order and show payment modal
  const handleCreateCard = async () => {
    setTouched({ name: true, email: true });

    // Check authentication
    if (!isAuthenticated || !walletAddress) {
      toast.warning('Connect Wallet', 'Please connect your wallet to create a card');
      login();
      return;
    }

    if (!canSubmit) {
      if (!isValidEmail) toast.error('Invalid Email', 'Please enter a valid email address');
      else if (!isValidName) toast.error('Invalid Name', 'Please enter your name');
      else if (!isValidAmount) toast.error('Invalid Amount', 'Amount must be between $5 and $10,000');
      return;
    }

    const order = await createCard({
      amount: actualAmount,
      cardType,
      email,
    });

    if (order) {
      // Save orderId to database
      await saveOrderToDB({
        orderId: order.orderId,
        cardType,
        amount: actualAmount,
      });

      setShowPaymentModal(true);
      pollOrder(order.orderId);
      toast.info('Order Created', 'Complete payment to receive your card');
    } else if (error) {
      toast.error('Order Failed', error);
    }
  };

  // Send payment from wallet
  const handleWalletPay = useCallback(async () => {
    if (!currentOrder || !primaryWallet || !paymentAddress || !paymentAmount) return;

    try {
      setSending(true);
      toast.info('Sending Payment', 'Please confirm in your wallet...');

      const connection = new Connection(rpcUrl);
      const lamports = Math.ceil(paymentAmount * LAMPORTS_PER_SOL);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(primaryWallet.address),
          toPubkey: new PublicKey(paymentAddress),
          lamports,
        })
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = new PublicKey(primaryWallet.address);

      const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
      const { signedTransaction } = await signTransaction({
        transaction: serialized,
        wallet: primaryWallet as never,
      });

      const signature = await connection.sendRawTransaction(signedTransaction);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

      setTxSignature(signature);
      toast.success('Payment Sent!', 'Your card will be issued shortly');
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      toast.error('Payment Failed', errorMessage);
    } finally {
      setSending(false);
    }
  }, [currentOrder, primaryWallet, paymentAddress, paymentAmount, rpcUrl, signTransaction, toast]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    stopPolling();
    reset();
    setTxSignature(null);
  };

  // Mainnet check
  if (network !== 'mainnet') {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Mainnet Only</h2>
          <p className="text-text-muted mb-4">Virtual cards are only available on mainnet.</p>
          <Badge variant="warning">Currently on {network}</Badge>
        </Card>
      </div>
    );
  }

  // Auth prompt banner (shown when not connected)
  const AuthBanner = !isAuthenticated ? (
    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 border border-neon-green/30">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-neon-green" />
          <div>
            <p className="text-text-primary font-medium text-sm">Connect to track your orders</p>
            <p className="text-text-muted text-xs">Sign in to save and view your card order history</p>
          </div>
        </div>
        <Button onClick={login} variant="primary" size="sm">
          Connect Wallet
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Auth Banner */}
      {AuthBanner}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Virtual Cards</h1>
            <p className="text-text-muted text-sm">Instant Mastercard/Visa funded with crypto • No KYC</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <Badge variant="success" size="sm"><Zap className="w-3 h-3 mr-1" />Instant</Badge>
          <Badge variant="info" size="sm"><Shield className="w-3 h-3 mr-1" />Zero-Knowledge</Badge>
          <Badge variant="cyan" size="sm"><Globe className="w-3 h-3 mr-1" />Global</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Card Preview */}
        <div className="space-y-6">
          <VirtualCard3D
            cardType={cardType}
            amount={actualAmount}
            email={email || 'your@email.com'}
            cardholderName={cardholderName || 'YOUR NAME'}
            paymentAddress={paymentAddress}
            status={orderStatus?.status}
            cardDetails={orderStatus?.cardDetails}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />

          <div className="grid grid-cols-2 gap-3">
            <FeatureCard icon={Shield} title="No KYC" description="Complete privacy" />
            <FeatureCard icon={Zap} title="Instant" description="Minutes after payment" />
            <FeatureCard icon={Globe} title="Global" description="Worldwide acceptance" />
            <FeatureCard icon={Sparkles} title="Apple Pay" description="Add to wallet" />
          </div>
        </div>

        {/* Right: Order Form */}
        <Card className="p-5 h-fit">
          <h3 className="text-base font-semibold text-text-primary mb-4">Create Virtual Card</h3>

          {/* Card Type */}
          <div className="mb-5">
            <label className="text-xs text-text-muted mb-2 block uppercase tracking-wide">Card Network</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCardType('visa')}
                className={`relative p-3 rounded-lg border transition-all flex items-center justify-center ${
                  cardType === 'visa' ? 'border-blue-500 bg-blue-500/10' : 'border-border-primary hover:border-blue-500/50 bg-bg-elevated'
                }`}
              >
                <svg className="h-5" viewBox="0 0 1000 324" fill={cardType === 'visa' ? '#1a1f71' : '#666'}>
                  <path d="M651.19 0.5c-70.93 0-134.32 36.76-134.32 104.69 0 77.9 112.42 83.28 112.42 122.42 0 16.48-18.88 31.23-51.14 31.23-45.77 0-79.98-20.61-79.98-20.61l-14.64 68.55s39.41 17.41 91.73 17.41c77.55 0 138.58-38.57 138.58-107.66 0-82.32-113.04-87.6-113.04-123.9 0-12.91 15.5-27.03 47.66-27.03 36.29 0 65.89 14.99 65.89 14.99l14.33-66.2S696.99 0.5 651.19 0.5zM2.22 5.49L0 17.54s29.51 5.36 56.13 15.93c34.23 12.39 36.68 19.57 42.44 42.13l62.87 238.58h84.94L374.82 5.49h-84.71l-84.38 219.04-34.23-185.71c-3.21-20.5-19.45-33.33-38.08-33.33H2.22zM410.24 5.49l-66.63 308.69h80.83l66.39-308.69h-80.59zM905.16 5.49c-18.63 0-28.48 10.01-35.67 27.51l-118.34 281.18h84.71l16.42-46.06h103.38l9.88 46.06H1000L970.19 5.49h-65.03zm11.07 83.23l24.7 117.13h-67.01l42.31-117.13z"/>
                </svg>
              </button>
              <button
                onClick={() => setCardType('mastercard')}
                className={`relative p-3 rounded-lg border transition-all flex items-center justify-center ${
                  cardType === 'mastercard' ? 'border-orange-500 bg-orange-500/10' : 'border-border-primary hover:border-orange-500/50 bg-bg-elevated'
                }`}
              >
                <svg className="h-6" viewBox="0 0 152 108" fill="none">
                  <circle cx="98" cy="54" r="54" fill="#F79E1B"/>
                  <circle cx="54" cy="54" r="54" fill="#EB001B"/>
                  <path d="M76 17.88c12.4 9.96 20.36 25.18 20.36 42.12S88.4 89.16 76 99.12c-12.4-9.96-20.36-25.18-20.36-42.12S63.6 27.84 76 17.88z" fill="#FF5F00"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-5">
            <label className="text-xs text-text-muted mb-2 block uppercase tracking-wide">Amount (USD)</label>
            <div className="flex gap-1.5 mb-2">
              {CARD_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                  className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                    selectedAmount === amt && !customAmount
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                      : 'bg-bg-elevated text-text-secondary border border-transparent hover:border-border-primary'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
              <input
                type="number"
                placeholder="Custom ($5 - $10,000)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-bg-elevated border border-border-primary rounded-lg pl-7 pr-3 py-2 text-sm text-text-primary focus:border-neon-green focus:outline-none"
              />
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide">Cardholder Name</label>
            <input
              type="text"
              placeholder="JOHN DOE"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              className={`w-full bg-bg-elevated border rounded-lg px-3 py-2 text-sm text-text-primary uppercase tracking-wide focus:outline-none ${
                !isValidName && touched.name ? 'border-warning' : 'border-border-primary focus:border-neon-green'
              }`}
            />
            {!isValidName && touched.name && (
              <p className="text-xs text-warning mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />Name required (min 2 chars)
              </p>
            )}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide">
              Email <span className="normal-case text-text-muted/70">(card details sent here)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                className={`w-full bg-bg-elevated border rounded-lg pl-9 pr-8 py-2 text-sm text-text-primary focus:outline-none ${
                  !isValidEmail && touched.email && email ? 'border-warning' : 'border-border-primary focus:border-neon-green'
                }`}
              />
              {isValidEmail && email && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />}
            </div>
          </div>

          {/* Price Summary */}
          {priceQuote?.pricing && isValidAmount && (
            <div className="bg-bg-elevated rounded-lg p-3 mb-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Card Value</span>
                <span className="text-text-primary">${priceQuote.pricing.card_value}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Fee ({priceQuote.pricing.starpay_fee_percent}%)</span>
                <span className="text-text-primary">${priceQuote.pricing.starpay_fee_usd.toFixed(2)}</span>
              </div>
              {priceQuote.pricing.reseller_markup_usd > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Processing</span>
                  <span className="text-text-primary">${priceQuote.pricing.reseller_markup_usd.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border-primary pt-1.5 flex justify-between items-center">
                <span className="text-xs text-text-muted font-medium">Total</span>
                <span className="text-neon-green font-bold">${priceQuote.pricing.customer_price.toFixed(2)}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-error/10 border border-error/50 rounded-lg p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-error" />
              <span className="text-error text-sm">{error}</span>
            </div>
          )}

          <Button onClick={handleCreateCard} disabled={loading || !canSubmit} className="w-full py-3" variant="primary">
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
            Create ${actualAmount} {cardType === 'visa' ? 'Visa' : 'Mastercard'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-center text-text-muted text-[10px] mt-3">Powered by StarPay • Zero-Knowledge Technology</p>
        </Card>
      </div>

      {/* ===== ORDER HISTORY SECTION ===== */}
      {isAuthenticated && (
        <div className="mt-8">
          <Card className="p-4">
            <ActivityTable
              items={savedOrders.map((order): ActivityItem => {
                const details = orderDetails.get(order.orderId);
                return {
                  id: order._id,
                  type: 'cards',
                  action: `${order.cardType === 'visa' ? 'Visa' : 'Mastercard'} Card`,
                  description: `Order #${order.orderId.slice(0, 8)}`,
                  amount: details?.amount || order.amount,
                  status: (details?.status || 'pending') as ActivityItem['status'],
                  timestamp: order.createdAt,
                  txSignature: order.txSignature,
                  onAction: details?.status === 'pending' ? async () => {
                    toast.info('Resuming Order', 'Fetching order details...');
                    const status = await resumeOrder(order.orderId);
                    if (status) {
                      setShowPaymentModal(true);
                      pollOrder(order.orderId);
                    }
                  } : undefined,
                  actionLabel: 'Pay',
                };
              })}
              loading={loadingOrders}
              onRefresh={fetchSavedOrders}
              emptyMessage="No card orders yet. Create your first card above!"
              maxItems={5}
            />
          </Card>
        </div>
      )}

      {/* ===== UNIFIED PAYMENT MODAL ===== */}
      {showPaymentModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closePaymentModal} />

          <div className="relative z-10 w-full max-w-md bg-bg-secondary rounded-2xl border border-border-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-primary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-neon-green" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Complete Payment</h3>
                  <p className="text-xs text-text-muted font-mono">#{currentOrder.orderId}</p>
                </div>
              </div>
              <button onClick={closePaymentModal} className="p-2 rounded-lg hover:bg-bg-elevated transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Order Summary */}
            <div className="p-4 bg-bg-tertiary/50 border-b border-border-primary/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Card Value</span>
                <span className="text-sm text-text-primary font-medium">${cardValue}</span>
              </div>
              {totalUSD && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">Total (inc. fees)</span>
                  <span className="text-sm text-text-primary font-medium">${totalUSD.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">You Pay</span>
                <span className="text-lg text-neon-green font-bold">{paymentAmount} SOL</span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="p-4">
              <div className="flex bg-bg-elevated rounded-xl p-1 mb-4 border border-border-primary">
                <button
                  onClick={() => setPaymentTab('qr')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    paymentTab === 'qr' ? 'bg-neon-green/20 text-neon-green' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <QrCodeIcon className="w-4 h-4" />
                  Scan QR
                </button>
                <button
                  onClick={() => setPaymentTab('wallet')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    paymentTab === 'wallet' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Connected Wallet
                </button>
              </div>

              {/* QR Tab Content */}
              {paymentTab === 'qr' && (
                <div className="space-y-4">
                  {paymentAddress ? (
                    <>
                      <div className="flex justify-center">
                        <div className="p-4 bg-white rounded-2xl shadow-lg">
                          <QRCodeSVG
                            value={`solana:${paymentAddress}?amount=${paymentAmount}`}
                            size={160}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="H"
                          />
                        </div>
                      </div>

                      <div
                        onClick={() => handleCopy(paymentAddress)}
                        className="bg-bg-elevated rounded-lg p-3 font-mono text-xs text-text-secondary break-all cursor-pointer hover:bg-bg-tertiary transition-colors flex items-center gap-2 border border-border-primary"
                      >
                        <span className="flex-1">{paymentAddress}</span>
                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-text-muted" />}
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-8 h-8 text-text-muted animate-spin" />
                    </div>
                  )}
                </div>
              )}

              {/* Wallet Tab Content */}
              {paymentTab === 'wallet' && (
                <div className="space-y-4">
                  {primaryWallet ? (
                    <>
                      <div className="bg-bg-elevated rounded-lg p-4 border border-border-primary">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-text-muted">From</span>
                          <span className="text-xs text-text-secondary font-mono">
                            {primaryWallet.address.slice(0, 6)}...{primaryWallet.address.slice(-4)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-muted">Balance</span>
                          <span className={`text-xs font-mono ${balance && paymentAmount && balance >= paymentAmount ? 'text-success' : 'text-error'}`}>
                            {balance?.toFixed(4) || '...'} SOL
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleWalletPay}
                        disabled={sending || !paymentAmount || (balance !== null && balance < paymentAmount) || !!txSignature}
                        className="w-full"
                        variant={txSignature ? 'success' : 'primary'}
                      >
                        {sending ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                        ) : txSignature ? (
                          <><CheckCircle2 className="w-4 h-4 mr-2" />Payment Sent!</>
                        ) : (
                          <><Send className="w-4 h-4 mr-2" />Pay {paymentAmount} SOL</>
                        )}
                      </Button>

                      {txSignature && (
                        <a
                          href={`https://solscan.io/tx/${txSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 text-xs text-neon-cyan hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View on Solscan
                        </a>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Wallet className="w-12 h-12 text-text-muted mx-auto mb-3" />
                      <p className="text-text-muted text-sm">No wallet connected</p>
                      <p className="text-text-muted/70 text-xs mt-1">Connect a wallet to pay directly</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Footer */}
            <div className="p-4 border-t border-border-primary bg-bg-tertiary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      orderStatus?.status === 'issued' ? 'success' :
                      orderStatus?.status === 'processing' ? 'info' :
                      orderStatus?.status === 'failed' || orderStatus?.status === 'expired' ? 'error' :
                      'warning'
                    }
                    size="sm"
                  >
                    {orderStatus?.status || currentOrder.status}
                  </Badge>
                  {isPolling && <RefreshCw className="w-3 h-3 text-neon-green animate-spin" />}
                </div>

                {expiresIn && (
                  <div className={`flex items-center gap-1 text-xs ${expiresIn === 'Expired' ? 'text-error' : 'text-warning'}`}>
                    <Timer className="w-3 h-3" />
                    {expiresIn === 'Expired' ? 'Expired' : expiresIn}
                  </div>
                )}
              </div>

              {orderStatus?.status === 'issued' && (
                <div className="mt-3 flex items-center gap-2 text-success text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Card issued! Details sent to {email}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Card Issued!"
        message={`Your ${cardType === 'visa' ? 'Visa' : 'Mastercard'} virtual card has been created. Card details have been sent to ${email}.`}
        txSignature={txSignature || undefined}
      />
    </div>
  );
}
