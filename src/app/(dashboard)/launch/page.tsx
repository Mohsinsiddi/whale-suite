"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs, { TabPanel } from "@/components/ui/Tabs";
import { TransactionModal, SuccessModal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/privy/hooks";
import LearnMoreLink from "@/components/ui/LearnMoreLink";
import { usePoints } from "@/hooks";
import { WalletMismatchBanner } from "@/components/ui/WalletMismatchBanner";

interface TokenLinks {
  dexscreener: string;
  jupiter: string;
  anoncoin: string;
  solscan: string;
}

interface CreateTokenResult {
  success: boolean;
  mintAddress?: string;
  signature?: string;
  message?: string;
  links?: TokenLinks;
  error?: string;
}

interface TokenRecord {
  _id?: string;
  wallet: string;
  mintAddress: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  twitterLink?: string;
  telegramLink?: string;
  signature: string;
  createdAt: string;
  metadata?: {
    supply?: string;
    decimals?: number;
    lastUpdated?: string;
  };
}

// Icons
const RocketIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const CoinsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

// Animated input component
const AnimatedInput = ({
  label,
  required,
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
  className = "",
  icon,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength?: number;
  type?: string;
  className?: string;
  icon?: React.ReactNode;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <label className="block text-sm font-medium text-text-secondary mb-2">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`
            w-full px-4 py-3.5 rounded-xl bg-bg-tertiary border-2 text-text-primary
            placeholder-text-muted/50 transition-all duration-300 ease-out
            focus:outline-none focus:ring-0
            ${icon ? 'pl-12' : ''}
            ${isFocused
              ? 'border-neon-green shadow-[0_0_20px_rgba(0,255,136,0.15)]'
              : 'border-border-secondary hover:border-border-primary'
            }
            ${className}
          `}
        />
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Animated feature item
const FeatureItem = ({ children, delay }: { children: React.ReactNode; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="flex items-center gap-2 group"
  >
    <motion.div
      whileHover={{ scale: 1.2, rotate: 10 }}
      className="flex-shrink-0"
    >
      <CheckIcon className="w-4 h-4 text-neon-green" />
    </motion.div>
    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
      {children}
    </span>
  </motion.div>
);

// Step item for How It Works
const StepItem = ({
  number,
  title,
  description,
  delay
}: {
  number: number;
  title: string;
  description: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="flex items-start gap-3 group"
  >
    <motion.div
      whileHover={{ scale: 1.1 }}
      className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center flex-shrink-0 border border-neon-green/30 group-hover:border-neon-green/60 transition-colors"
    >
      <span className="text-sm font-bold text-neon-green">{number}</span>
    </motion.div>
    <div>
      <p className="text-sm font-medium text-text-primary group-hover:text-neon-green transition-colors">
        {title}
      </p>
      <p className="text-xs text-text-muted mt-0.5">
        {description}
      </p>
    </div>
  </motion.div>
);

// Token Preview Modal - Clean & Responsive
const TokenPreviewModal = ({
  token,
  onClose,
}: {
  token: TokenRecord;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  const copyMint = () => {
    navigator.clipboard.writeText(token.mintAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl h-[90vh] bg-bg-secondary rounded-2xl border border-border-primary overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header - Compact with all info */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border-secondary bg-bg-tertiary/50 flex-shrink-0">
          {/* Left: Token Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {token.imageUrl && (
              <img
                src={token.imageUrl}
                alt={token.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-xl font-bold text-text-primary truncate">
                  {token.name}
                </h3>
                <Badge variant="success" size="sm">${token.symbol}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <button
                  onClick={copyMint}
                  className="text-xs text-text-muted font-mono hover:text-neon-cyan transition-colors flex items-center gap-1"
                >
                  {token.mintAddress.slice(0, 6)}...{token.mintAddress.slice(-6)}
                  {copied ? <CheckIcon className="w-3 h-3 text-neon-green" /> : <CopyIcon className="w-3 h-3" />}
                </button>
                {token.description && (
                  <span className="hidden md:block text-xs text-text-muted truncate max-w-xs">
                    {token.description}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Links + Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={`https://anoncoin.it/${token.symbol.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neon-green bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 rounded-lg transition-colors"
            >
              <ShieldIcon className="w-3.5 h-3.5" />
              Anoncoin
              <ExternalLinkIcon className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <CloseIcon className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>

        {/* DexScreener Iframe - Takes most space */}
        <div className="flex-1 bg-bg-primary">
          <iframe
            src={`https://dexscreener.com/solana/${token.mintAddress}?embed=1&theme=dark`}
            className="w-full h-full border-0"
            title={`${token.name} on DexScreener`}
          />
        </div>

        {/* Footer - Compact action bar */}
        <div className="flex items-center justify-between p-3 border-t border-border-secondary bg-bg-tertiary/50 flex-shrink-0">
          {/* Social Links */}
          <div className="flex items-center gap-1">
            {token.twitterLink && (
              <a href={token.twitterLink} target="_blank" rel="noopener noreferrer"
                 className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
                <TwitterIcon className="w-4 h-4 text-text-muted hover:text-text-primary" />
              </a>
            )}
            {token.telegramLink && (
              <a href={token.telegramLink} target="_blank" rel="noopener noreferrer"
                 className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
                <TelegramIcon className="w-4 h-4 text-text-muted hover:text-text-primary" />
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={`https://anoncoin.it/${token.symbol.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neon-green bg-bg-tertiary rounded-lg"
            >
              Anoncoin <ExternalLinkIcon className="w-3 h-3" />
            </a>
            <a
              href={`https://solscan.io/token/${token.mintAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-neon-cyan bg-bg-tertiary rounded-lg transition-colors"
            >
              Solscan <ExternalLinkIcon className="w-3 h-3" />
            </a>
            <a
              href={`https://jup.ag/swap?sell=So11111111111111111111111111111111111111112&buy=${token.mintAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-bg-primary bg-neon-green hover:bg-neon-green/90 rounded-lg transition-colors"
            >
              Trade on Jupiter <ExternalLinkIcon className="w-3 h-3" />
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Token Card for My Coins (Responsive)
const TokenCard = ({
  token,
  onView,
  delay,
}: {
  token: TokenRecord;
  onView: () => void;
  delay: number;
}) => {
  const [copied, setCopied] = useState(false);

  const copyMint = () => {
    navigator.clipboard.writeText(token.mintAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card variant="default" padding="md" className="group hover:border-neon-green/50 transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          {/* Token Image + Info Row on Mobile */}
          <div className="flex items-start gap-3 w-full sm:w-auto">
            {/* Token Image */}
            <div className="relative flex-shrink-0">
              {token.imageUrl ? (
                <img
                  src={token.imageUrl}
                  alt={token.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
                  <CoinsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-neon-green" />
                </div>
              )}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-neon-green rounded-full flex items-center justify-center shadow-lg"
              >
                <CheckIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-bg-primary" />
              </motion.div>
            </div>

            {/* Token Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-text-primary truncate max-w-[120px] sm:max-w-none">
                  {token.name}
                </h3>
                <Badge variant="success" size="sm">
                  ${token.symbol}
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-text-muted line-clamp-2 mb-1.5 sm:mb-2">
                {token.description || "No description"}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <button
                  onClick={copyMint}
                  className="flex items-center gap-1 text-[10px] sm:text-xs font-mono text-text-muted hover:text-neon-green transition-colors"
                >
                  <span className="hidden xs:inline">{token.mintAddress.slice(0, 6)}...{token.mintAddress.slice(-4)}</span>
                  <span className="xs:hidden">{token.mintAddress.slice(0, 4)}...{token.mintAddress.slice(-3)}</span>
                  {copied ? (
                    <CheckIcon className="w-3 h-3 text-neon-green" />
                  ) : (
                    <CopyIcon className="w-3 h-3" />
                  )}
                </button>
                <span className="text-[10px] sm:text-xs text-text-muted">
                  {new Date(token.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions - Always visible on mobile, hover on desktop */}
          <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <Button
              variant="primary"
              size="sm"
              onClick={onView}
              fullWidth
              className="sm:w-auto sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              View
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default function LaunchPage() {
  const { authenticated, walletAddress, login } = useAuth();
  const { awardPoints } = usePoints();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("launch");

  // Form state
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [twitterLink, setTwitterLink] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateTokenResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // My Coins state
  const [myTokens, setMyTokens] = useState<TokenRecord[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenRecord | null>(null);

  // Fetch user's tokens
  const fetchMyTokens = useCallback(async () => {
    if (!walletAddress) return;

    setTokensLoading(true);
    try {
      const response = await fetch(`/api/tokens?wallet=${walletAddress}`);
      const data = await response.json();
      if (data.tokens) {
        setMyTokens(data.tokens);
      }
    } catch (err) {
      console.error("Failed to fetch tokens:", err);
    } finally {
      setTokensLoading(false);
    }
  }, [walletAddress]);

  // Fetch tokens on mount and when tab changes
  useEffect(() => {
    if (activeTab === "mycoins" && walletAddress) {
      fetchMyTokens();
    }
  }, [activeTab, walletAddress, fetchMyTokens]);

  // Transaction modal steps
  const getStepStatus = (stepIndex: number): "pending" | "active" | "completed" | "error" => {
    if (error && stepIndex === currentStep) return "error";
    if (stepIndex < currentStep) return "completed";
    if (stepIndex === currentStep) return "active";
    return "pending";
  };

  const txSteps = [
    { label: "Preparing token metadata...", status: getStepStatus(0) },
    { label: "Creating token on Anoncoin...", status: getStepStatus(1) },
    { label: "Broadcasting to Solana...", status: getStepStatus(2) },
    { label: "Confirming transaction...", status: getStepStatus(3) },
  ];

  // Image handling with drag & drop
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const processImage = (file: File) => {
    console.log("[processImage] Called with:", file.name, file.type, file.size);

    if (file.size > 5 * 1024 * 1024) {
      console.log("[processImage] File too large");
      setError("Image must be less than 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("[processImage] FileReader complete, setting preview");
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      console.error("[processImage] FileReader error:", reader.error);
      setError("Failed to read image file");
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[Drag] Enter - types:", e.dataTransfer.types);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Required: Set dropEffect to allow drop
    e.dataTransfer.dropEffect = "copy";
    if (!isDragging) {
      console.log("[Drag] Over - setting isDragging true");
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node | null;
    const currentTarget = e.currentTarget as Node;

    // Only set to false if leaving the drop zone entirely
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      console.log("[Drag] Leave - exiting drop zone");
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    console.log("[Drop] Event fired");
    console.log("[Drop] Files:", e.dataTransfer.files);
    console.log("[Drop] Items:", e.dataTransfer.items);
    console.log("[Drop] Types:", e.dataTransfer.types);

    // Method 1: Try direct files (works for OS file explorer drops)
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log("[Drop] File from files:", file.name, file.type, file.size);

      if (file.type.startsWith("image/")) {
        console.log("[Drop] Processing image...");
        processImage(file);
        return;
      } else {
        console.log("[Drop] Not an image:", file.type);
        setError("Please upload an image file (PNG, JPG, GIF, WEBP)");
        return;
      }
    }

    // Method 2: Try DataTransferItems (for some browsers/apps)
    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log("[Drop] Item:", item.kind, item.type);

        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file && file.type.startsWith("image/")) {
            console.log("[Drop] Processing image from items...");
            processImage(file);
            return;
          }
        }
      }
    }

    // Check if this is a VS Code / IDE drop (no actual file data)
    const types = e.dataTransfer.types;
    if (types.includes("codefiles") || types.includes("codeeditors") || types.includes("application/vnd.code.uri-list")) {
      console.log("[Drop] Detected VS Code/IDE drop - no file data available");
      setError("Please drag from your file explorer (Finder/Explorer), not from VS Code");
      return;
    }

    console.log("[Drop] No valid files found");
    setError("No image file detected. Drag from Finder or File Explorer.");
  };

  // Save token to DB
  const saveTokenToDB = async (tokenData: {
    mintAddress: string;
    signature: string;
  }) => {
    if (!walletAddress) return;

    try {
      await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          mintAddress: tokenData.mintAddress,
          name: tokenName,
          symbol: tokenSymbol.toUpperCase(),
          description,
          imageUrl: imagePreview,
          twitterLink,
          telegramLink,
          signature: tokenData.signature,
        }),
      });
    } catch (err) {
      console.error("Failed to save token to DB:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!authenticated || !walletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    if (!tokenName || !tokenSymbol || !description) {
      setError("Please fill in all required fields");
      return;
    }

    if (!imageFile) {
      setError("Please upload a token image");
      return;
    }

    setLoading(true);
    setCurrentStep(0);

    try {
      // Step 1: Prepare metadata
      setCurrentStep(0);
      await new Promise((r) => setTimeout(r, 500));

      // Step 2: Create form data
      setCurrentStep(1);
      const formData = new FormData();
      formData.append("files", imageFile);
      formData.append("tickerName", tokenName);
      formData.append("tickerSymbol", tokenSymbol.toUpperCase());
      formData.append("description", description);
      if (twitterLink) formData.append("twitterLink", twitterLink);
      if (telegramLink) formData.append("telegramLink", telegramLink);
      formData.append("royaltyUser", "siddi_404");

      // Step 3: Call API
      setCurrentStep(2);
      const response = await fetch("/api/anoncoin/create", {
        method: "POST",
        body: formData,
      });

      // Step 4: Process response
      setCurrentStep(3);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || data.details || "Failed to create token");
      }

      // Save to DB
      if (data.mintAddress && data.signature) {
        await saveTokenToDB({
          mintAddress: data.mintAddress,
          signature: data.signature,
        });

        // Award points for token launch
        try {
          await awardPoints("token_launch", {
            txSignature: data.signature,
            mintAddress: data.mintAddress,
            tokenName,
            tokenSymbol: tokenSymbol.toUpperCase(),
          });
        } catch (pointsError) {
          console.warn("Failed to award points:", pointsError);
        }
      }

      setResult(data);
      setShowSuccessModal(true);

      // Refresh token list
      fetchMyTokens();

      // Reset form
      setTokenName("");
      setTokenSymbol("");
      setDescription("");
      setTwitterLink("");
      setTelegramLink("");
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create token");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFormValid = authenticated && tokenName && tokenSymbol && description && imageFile;

  // Calculate form completion percentage
  const completionSteps = [
    !!tokenName,
    !!tokenSymbol,
    !!description,
    !!imageFile,
  ];
  const completionPercent = (completionSteps.filter(Boolean).length / completionSteps.length) * 100;

  const tabs = [
    { id: "launch", label: "Launch Coin", icon: <RocketIcon className="w-4 h-4" /> },
    { id: "mycoins", label: "My Coins", icon: <CoinsIcon className="w-4 h-4" />, badge: myTokens.length },
  ];

  return (
    <div className="space-y-6">
      <WalletMismatchBanner />

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-green via-neon-cyan to-neon-green flex items-center justify-center shadow-lg shadow-neon-green/20"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <RocketIcon className="w-6 h-6 text-bg-primary" />
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                Anonymous Token Launcher
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <SparklesIcon className="w-5 h-5 text-neon-cyan" />
                </motion.div>
              </h1>
              <LearnMoreLink section="anoncoin">Docs</LearnMoreLink>
            </div>
            <p className="text-sm text-text-muted">
              Create tokens anonymously on Solana mainnet
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Badge variant="success" size="sm" className="shadow-lg shadow-neon-green/20">
              $10K Bounty
            </Badge>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="default"
          size="md"
        />
      </motion.div>

      {/* Tab Content */}
      <TabPanel value="launch" activeValue={activeTab}>
        {/* Gasless + Anonymous Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-6"
        >
          <Card variant="default" padding="md" className="border-neon-green/30 bg-gradient-to-r from-neon-green/5 via-bg-tertiary/50 to-neon-cyan/5 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neon-green/10 via-transparent to-transparent" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
              <motion.div
                animate={{
                  boxShadow: ["0 0 0 0 rgba(0,255,136,0.4)", "0 0 0 10px rgba(0,255,136,0)", "0 0 0 0 rgba(0,255,136,0)"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 rounded-xl bg-neon-green/20 flex items-center justify-center flex-shrink-0"
              >
                <ShieldIcon className="w-6 h-6 text-neon-green" />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-semibold text-neon-green">
                    100% Anonymous & Gasless
                  </p>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-neon-cyan/20 text-neon-cyan rounded-full border border-neon-cyan/30">
                    NO GAS FEES
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  Launch tokens on Solana mainnet without paying gas. Your identity is never linked. Powered by Anoncoin.
                </p>
              </div>
              <a
                href="https://anoncoin.it"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neon-green bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/30 rounded-lg transition-colors flex-shrink-0"
              >
                <ShieldIcon className="w-3.5 h-3.5" />
                Anoncoin
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            </div>
          </Card>
        </motion.div>

        {/* Not Authenticated Warning */}
        {!authenticated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card variant="default" padding="md" className="border-warning/30 bg-warning/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                    <ShieldIcon className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warning">Wallet Not Connected</p>
                    <p className="text-xs text-text-muted">Connect your wallet to launch tokens and save them to your account</p>
                  </div>
                </div>
                <Button variant="primary" size="sm" onClick={login}>
                  Connect Wallet
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Token Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card variant="default" padding="lg" className="relative overflow-hidden">
              {/* Progress bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-bg-tertiary">
                <motion.div
                  className="h-full bg-gradient-to-r from-neon-green to-neon-cyan"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <CardHeader className="pt-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Token Details</CardTitle>
                  <span className="text-xs text-text-muted">
                    {completionSteps.filter(Boolean).length}/{completionSteps.length} completed
                  </span>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                {/* Token Name */}
                <AnimatedInput
                  label="Token Name"
                  required
                  value={tokenName}
                  onChange={setTokenName}
                  placeholder="e.g., Whale Coin"
                  maxLength={50}
                />

                {/* Token Symbol */}
                <AnimatedInput
                  label="Token Symbol"
                  required
                  value={tokenSymbol}
                  onChange={(v) => setTokenSymbol(v.toUpperCase())}
                  placeholder="e.g., WHALE"
                  maxLength={10}
                  className="uppercase tracking-wider font-mono"
                />

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Description <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your token and its purpose..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3.5 rounded-xl bg-bg-tertiary border-2 border-border-secondary text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-neon-green focus:shadow-[0_0_20px_rgba(0,255,136,0.15)] resize-none transition-all duration-300"
                  />
                  <div className="flex justify-between mt-1.5">
                    <p className="text-xs text-text-muted">
                      Be creative and descriptive
                    </p>
                    <motion.p
                      className={`text-xs font-mono ${description.length > 400 ? 'text-warning' : 'text-text-muted'}`}
                      animate={{ scale: description.length > 400 ? [1, 1.1, 1] : 1 }}
                    >
                      {description.length}/500
                    </motion.p>
                  </div>
                </motion.div>

                {/* Image Upload */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Token Image <span className="text-error">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <motion.div
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`
                      w-full p-8 rounded-xl border-2 border-dashed cursor-pointer
                      transition-all duration-300 flex flex-col items-center justify-center
                      ${isDragging
                        ? "border-neon-cyan bg-neon-cyan/10 scale-[1.02]"
                        : imagePreview
                          ? "border-neon-green bg-neon-green/5"
                          : "border-border-secondary hover:border-neon-green/50 bg-bg-tertiary/50"
                      }
                    `}
                  >
                    {/* Pointer events none on children to ensure drag works */}
                    <div className={isDragging ? "pointer-events-none" : ""}>
                      <AnimatePresence mode="wait">
                        {imagePreview ? (
                          <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative"
                          >
                            <img
                              src={imagePreview}
                              alt="Token preview"
                              className="w-28 h-28 rounded-2xl object-cover shadow-lg shadow-black/20"
                            />
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 w-7 h-7 bg-neon-green rounded-full flex items-center justify-center shadow-lg"
                            >
                              <CheckIcon className="w-4 h-4 text-bg-primary" />
                            </motion.div>
                            <p className="text-xs text-text-muted mt-3 text-center">
                              Click to change
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="upload"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                          >
                            <motion.div
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <ImageIcon className="w-12 h-12 text-text-muted mx-auto mb-3" />
                            </motion.div>
                            <p className="text-sm text-text-secondary font-medium">
                              {isDragging ? "Drop your image here!" : "Click or drag to upload"}
                            </p>
                            <p className="text-xs text-text-muted mt-1">
                              PNG, JPG, GIF, WEBP (max 5MB)
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Social Links */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Twitter/X Link
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <TwitterIcon className="w-4 h-4 text-text-muted" />
                      </div>
                      <input
                        type="url"
                        value={twitterLink}
                        onChange={(e) => setTwitterLink(e.target.value)}
                        placeholder="https://x.com/..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-bg-tertiary border-2 border-border-secondary text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-neon-green transition-all duration-300 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Telegram Link
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <TelegramIcon className="w-4 h-4 text-text-muted" />
                      </div>
                      <input
                        type="url"
                        value={telegramLink}
                        onChange={(e) => setTelegramLink(e.target.value)}
                        placeholder="https://t.me/..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-bg-tertiary border-2 border-border-secondary text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-neon-green transition-all duration-300 text-sm"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Error Display */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="p-4 rounded-xl bg-error/10 border border-error/30"
                    >
                      <p className="text-sm text-error font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.div
                  whileHover={{ scale: isFormValid && !loading ? 1.01 : 1 }}
                  whileTap={{ scale: isFormValid && !loading ? 0.99 : 1 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    disabled={!isFormValid || loading}
                    loading={loading}
                    className="py-4 text-base font-semibold"
                  >
                    {loading ? (
                      "Creating Token..."
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <RocketIcon className="w-5 h-5" />
                        Launch Token on Mainnet
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>
            </Card>
          </motion.div>

          {/* Info Sidebar */}
          <div className="space-y-5">
            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Card variant="default" padding="md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    How It Works
                    <Badge variant="info" size="sm">Simple</Badge>
                  </CardTitle>
                </CardHeader>
                <div className="space-y-4 mt-4">
                  <StepItem
                    number={1}
                    title="Fill Token Details"
                    description="Enter name, symbol, description and upload your token image"
                    delay={0.4}
                  />
                  <StepItem
                    number={2}
                    title="Anonymous Creation"
                    description="Anoncoin creates your token without linking your identity"
                    delay={0.5}
                  />
                  <StepItem
                    number={3}
                    title="Trade Anywhere"
                    description="Your token instantly appears on Jupiter, DexScreener, and more"
                    delay={0.6}
                  />
                </div>
              </Card>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card variant="default" padding="md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Features
                    <SparklesIcon className="w-4 h-4 text-neon-cyan" />
                  </CardTitle>
                </CardHeader>
                <div className="space-y-3 mt-4">
                  <FeatureItem delay={0.5}>100% Anonymous creation</FeatureItem>
                  <FeatureItem delay={0.55}>Instant DEX listing</FeatureItem>
                  <FeatureItem delay={0.6}>No KYC required</FeatureItem>
                  <FeatureItem delay={0.65}>Solana mainnet deployment</FeatureItem>
                  <FeatureItem delay={0.7}>Social links integration</FeatureItem>
                  <FeatureItem delay={0.75}>DexScreener verified</FeatureItem>
                </div>
              </Card>
            </motion.div>

            {/* Created Token Display */}
            <AnimatePresence>
              {result?.success && result.mintAddress && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <Card variant="default" padding="md" className="border-neon-green/50 bg-gradient-to-br from-neon-green/5 to-transparent">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-neon-green">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        >
                          <CheckIcon className="w-5 h-5" />
                        </motion.div>
                        Token Created!
                      </CardTitle>
                    </CardHeader>
                    <div className="space-y-4 mt-3">
                      <div>
                        <p className="text-xs text-text-muted mb-2">Mint Address</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-neon-green bg-bg-tertiary px-3 py-2 rounded-lg flex-1 overflow-hidden text-ellipsis font-mono">
                            {result.mintAddress}
                          </code>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => copyToClipboard(result.mintAddress!)}
                            className="p-2.5 bg-bg-tertiary hover:bg-neon-green/20 rounded-lg transition-colors"
                          >
                            {copied ? (
                              <CheckIcon className="w-4 h-4 text-neon-green" />
                            ) : (
                              <CopyIcon className="w-4 h-4 text-text-muted" />
                            )}
                          </motion.button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { href: result.links?.dexscreener, label: "DexScreener", color: "from-blue-500/20 to-purple-500/20" },
                          { href: result.links?.jupiter, label: "Jupiter", color: "from-orange-500/20 to-red-500/20" },
                          { href: result.links?.anoncoin, label: "Anoncoin", color: "from-neon-green/20 to-neon-cyan/20" },
                          { href: result.links?.solscan, label: "Solscan", color: "from-cyan-500/20 to-blue-500/20" },
                        ].map((link, i) => (
                          <motion.a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r ${link.color} rounded-xl text-sm text-text-primary font-medium hover:shadow-lg transition-shadow`}
                          >
                            {link.label}
                            <ExternalLinkIcon className="w-3.5 h-3.5" />
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </TabPanel>

      <TabPanel value="mycoins" activeValue={activeTab}>
        {!authenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
              <ShieldIcon className="w-10 h-10 text-neon-green" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
              Connect your wallet to view and manage your launched tokens
            </p>
            <Button variant="primary" onClick={login}>
              Connect Wallet
            </Button>
          </motion.div>
        ) : tokensLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : myTokens.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center">
              <RocketIcon className="w-10 h-10 text-neon-green" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">No Tokens Yet</h3>
            <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
              Launch your first anonymous token and it will appear here
            </p>
            <Button variant="primary" onClick={() => setActiveTab("launch")}>
              <RocketIcon className="w-4 h-4 mr-2" />
              Launch Your First Token
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-text-primary">Your Tokens</h2>
                <p className="text-xs sm:text-sm text-text-muted">{myTokens.length} token{myTokens.length !== 1 ? 's' : ''} launched</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchMyTokens}
                disabled={tokensLoading}
                className="flex-shrink-0"
              >
                <RefreshIcon className={`w-4 h-4 sm:mr-1 ${tokensLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>

            {/* Token Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {myTokens.map((token, index) => (
                <TokenCard
                  key={token._id || token.mintAddress}
                  token={token}
                  onView={() => setSelectedToken(token)}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </div>
        )}
      </TabPanel>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={loading}
        onClose={() => {}}
        title="Launching Token"
        steps={txSteps}
        currentStep={currentStep}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Token Launched!"
        message={`Your token has been created successfully on Solana mainnet.${result?.mintAddress ? `\n\nMint Address:\n${result.mintAddress}` : ''}`}
        txSignature={result?.signature}
      />

      {/* Token Preview Modal */}
      <AnimatePresence>
        {selectedToken && (
          <TokenPreviewModal
            token={selectedToken}
            onClose={() => setSelectedToken(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
