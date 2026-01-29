"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { WalletAvatar } from "../ui/Avatar";
import Dropdown, { DropdownItem, DropdownDivider } from "../ui/Dropdown";
import { TierBadge } from "../ui/Badge";
import NetworkSelectModal from "../ui/NetworkSelectModal";
import WhaleLogo from "../ui/WhaleLogo";
import { useAuth } from "@/lib/privy/hooks";
import { useUser, useWallet, useUI } from "@/store";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useNetwork, FEATURE_NETWORK_SUPPORT, type FeatureKey } from "@/hooks/useNetwork";

interface HeaderProps {
  variant?: "landing" | "app";
  wallet?: string;
}

export default function Header({ variant = "landing", wallet }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const { logout, walletAddress, authenticated, login } = useAuth();
  const { userNumber, badgeTier, privacyScore } = useUser();
  const { hiddenBalance } = useWallet();
  const { toggleSidebar } = useUI();

  // Use network context - rpcPing comes from provider
  const { network, rpcPing, isFeatureAvailable } = useNetwork();

  // Fetch real SOL balance from blockchain
  const displayWalletAddr = wallet || walletAddress;
  const { balance, loading: balanceLoading } = useWalletBalance(displayWalletAddr);

  const displayWallet = displayWalletAddr;
  const shortWallet = displayWallet
    ? `${displayWallet.slice(0, 4)}...${displayWallet.slice(-4)}`
    : '';

  const handleDisconnect = async () => {
    try {
      console.log('Disconnecting wallet...');
      await logout();
      localStorage.removeItem('whale-suite-welcome-seen');
      localStorage.removeItem('whale-suite-storage');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-border-primary">
      <div className="flex items-center justify-between h-14 px-4">
          {/* Left Side - Menu Button (mobile) + Logo */}
          <div className="flex items-center gap-3">
            {variant === "app" && (
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                <MenuIcon className="w-5 h-5 text-text-secondary" />
              </button>
            )}

            <Link href={variant === "app" ? "/dashboard" : "/"} className="flex items-center">
              <WhaleLogo
                size="sm"
                showText={true}
                animated={true}
                className="hidden sm:flex"
              />
              {/* Mobile logo - use sm size for better visibility */}
              <WhaleLogo
                size="sm"
                showText={false}
                animated={false}
                className="sm:hidden"
              />
            </Link>

            {/* Network Toggle - Desktop only in app variant */}
            {variant === "app" && (
              <div className="hidden sm:block">
                <NetworkToggle
                  network={network}
                  ping={rpcPing}
                  onClick={() => setNetworkModalOpen(true)}
                />
              </div>
            )}
          </div>

          {/* Nav Links - Desktop (Landing only) */}
          {variant === "landing" && (
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm text-text-secondary hover:text-neon-green transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm text-text-secondary hover:text-neon-green transition-colors">
                Pricing
              </Link>
              <Link href="/docs" className="text-sm text-text-secondary hover:text-neon-green transition-colors">
                Docs
              </Link>
            </nav>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {variant === "landing" ? (
              <Link
                href="/dashboard"
                className="px-4 py-1.5 text-sm font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-lg hover:shadow-glow-sm transition-all"
              >
                Launch App
              </Link>
            ) : authenticated ? (
              <>
                {/* Wallet/Balance Dropdown - Desktop only */}
                <div className="hidden sm:block">
                  <WalletDropdown
                    balance={balance}
                    balanceLoading={balanceLoading}
                    hiddenBalance={hiddenBalance}
                    network={network}
                  />
                </div>

                {/* Profile Dropdown - Enhanced */}
                <ProfileDropdown
                  displayWallet={displayWallet}
                  shortWallet={shortWallet}
                  userNumber={userNumber}
                  badgeTier={badgeTier}
                  privacyScore={privacyScore}
                  network={network}
                  balance={balance}
                  balanceLoading={balanceLoading}
                  hiddenBalance={hiddenBalance}
                  onDisconnect={handleDisconnect}
                  isFeatureAvailable={isFeatureAvailable}
                />
              </>
            ) : (
              <button
                onClick={() => login()}
                className="px-4 py-1.5 text-sm font-semibold bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary rounded-lg hover:shadow-glow-sm transition-all"
              >
                Connect Wallet
              </button>
            )}

            {/* Mobile Menu Button (Landing only) */}
            {variant === "landing" && (
              <button
                className="md:hidden p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <CloseIcon className="w-4 h-4 text-text-secondary" />
                ) : (
                  <MenuIcon className="w-4 h-4 text-text-secondary" />
                )}
              </button>
            )}
          </div>
        </div>

      {/* Mobile Menu (Landing) */}
      {mobileMenuOpen && variant === "landing" && (
        <div className="md:hidden border-t border-border-primary bg-bg-primary/95 backdrop-blur-xl">
          <nav className="px-4 py-4 flex flex-col gap-2">
            <Link
              href="#features"
              className="px-3 py-2 text-sm text-text-secondary hover:text-neon-green transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="px-3 py-2 text-sm text-text-secondary hover:text-neon-green transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
          </nav>
        </div>
      )}

      {/* Network Select Modal */}
      <NetworkSelectModal
        isOpen={networkModalOpen}
        onClose={() => setNetworkModalOpen(false)}
      />
    </header>
  );
}

// Network Toggle Component with Ping
function NetworkToggle({
  network,
  ping,
  onClick
}: {
  network: 'mainnet' | 'devnet';
  ping: number | null;
  onClick: () => void;
}) {
  const pingStatus = ping === null
    ? 'loading'
    : ping < 0
    ? 'error'
    : ping < 200
    ? 'excellent'
    : ping < 500
    ? 'good'
    : 'slow';

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] ${
        network === 'mainnet'
          ? 'bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/15 hover:border-neon-green/50'
          : 'bg-warning/10 text-warning border border-warning/30 hover:bg-warning/15 hover:border-warning/50'
      }`}
    >
      {/* Network indicator */}
      <span className={`w-2 h-2 rounded-full transition-all ${
        network === 'mainnet' ? 'bg-neon-green' : 'bg-warning'
      } ${ping !== null && ping >= 0 ? 'animate-pulse' : ''}`} />

      {/* Network name */}
      <span className="font-semibold">
        {network === 'mainnet' ? 'Mainnet' : 'Devnet'}
      </span>

      {/* Ping indicator */}
      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
        pingStatus === 'loading'
          ? 'bg-bg-tertiary text-text-muted'
          : pingStatus === 'error'
          ? 'bg-error/20 text-error'
          : pingStatus === 'excellent'
          ? 'bg-neon-green/20 text-neon-green'
          : pingStatus === 'good'
          ? 'bg-warning/20 text-warning'
          : 'bg-error/20 text-error'
      }`}>
        <SignalIcon className="w-2.5 h-2.5" />
        {pingStatus === 'loading' ? '...' : pingStatus === 'error' ? 'err' : `${ping}ms`}
      </span>

      {/* Chevron */}
      <ChevronUpDownIcon className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// Signal Icon for ping
const SignalIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546" />
  </svg>
);

// Wallet/Balance Dropdown
function WalletDropdown({
  balance,
  balanceLoading,
  hiddenBalance,
  network
}: {
  balance: number;
  balanceLoading: boolean;
  hiddenBalance: number;
  network: 'mainnet' | 'devnet';
}) {
  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-primary hover:border-neon-green/30 transition-all">
          <WalletIcon className="w-4 h-4 text-neon-green" />
          {balanceLoading ? (
            <span className="text-sm font-medium text-text-muted animate-pulse">...</span>
          ) : (
            <span className="text-sm font-medium text-text-primary">
              {balance.toFixed(2)} <span className="text-text-muted">SOL</span>
            </span>
          )}
          <ChevronDownIcon className="w-3 h-3 text-text-muted" />
        </button>
      }
    >
      <div className="w-64 p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Balances</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            network === 'mainnet'
              ? 'bg-neon-green/10 text-neon-green'
              : 'bg-warning/10 text-warning'
          }`}>
            {network}
          </span>
        </div>

        {/* Main Balance */}
        <div className="p-3 rounded-lg bg-bg-tertiary border border-border-primary mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
                <span className="text-sm">◎</span>
              </div>
              <div>
                <p className="text-xs text-text-muted">Solana</p>
                <p className="text-sm font-semibold text-text-primary">SOL</p>
              </div>
            </div>
            <div className="text-right">
              {balanceLoading ? (
                <p className="text-sm font-semibold text-text-muted animate-pulse">...</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-text-primary">{balance.toFixed(4)}</p>
                  <p className="text-xs text-text-muted">${(balance * 230).toFixed(2)}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hidden Balance */}
        {hiddenBalance > 0 && (
          <div className="p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                  <EyeOffIcon className="w-4 h-4 text-neon-cyan" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Shielded</p>
                  <p className="text-sm font-semibold text-neon-cyan">Hidden</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-neon-cyan">{hiddenBalance.toFixed(4)}</p>
                <p className="text-xs text-text-muted">${(hiddenBalance * 230).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t border-border-primary mt-2">
          <span className="text-xs text-text-muted">Total Value</span>
          <span className="text-sm font-semibold text-neon-green">
            ${((balance + hiddenBalance) * 230).toFixed(2)}
          </span>
        </div>
      </div>
    </Dropdown>
  );
}

// Profile Dropdown - Enhanced
function ProfileDropdown({
  displayWallet,
  shortWallet,
  userNumber,
  badgeTier,
  privacyScore,
  network,
  balance,
  balanceLoading,
  hiddenBalance,
  onDisconnect,
  isFeatureAvailable,
}: {
  displayWallet: string | null;
  shortWallet: string;
  userNumber: number | null;
  badgeTier: string | null;
  privacyScore: number;
  network: 'mainnet' | 'devnet';
  balance: number;
  balanceLoading: boolean;
  hiddenBalance: number;
  onDisconnect: () => void;
  isFeatureAvailable: (feature: FeatureKey) => boolean;
}) {
  const router = useRouter();

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-bg-tertiary/80 hover:bg-bg-tertiary transition-all border border-border-primary hover:border-neon-green/30 hover:shadow-glow-sm">
          {/* Connected indicator */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
          </span>
          <WalletAvatar address={displayWallet || "0x0000"} size="sm" showAddress={false} />
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-[10px] text-neon-green font-medium">Connected</span>
            <span className="text-xs font-semibold text-text-primary">
              {userNumber ? `Whale #${userNumber}` : shortWallet}
            </span>
          </div>
          {/* Mobile: Just show "Connected" text */}
          <span className="sm:hidden text-xs font-medium text-neon-green">Connected</span>
          <ChevronDownIcon className="w-3 h-3 text-text-muted" />
        </button>
      }
    >
      <div className="w-64 sm:w-72">
        {/* User Info Header */}
        <div className="px-3 py-3 border-b border-border-primary">
          <div className="flex items-center gap-3">
            <WalletAvatar address={displayWallet || "0x0000"} size="md" showAddress={false} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {userNumber ? `Whale #${userNumber}` : 'New Whale'}
              </p>
              <p className="text-xs text-text-muted font-mono">{shortWallet}</p>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              network === 'mainnet'
                ? 'bg-neon-green/10 text-neon-green'
                : 'bg-warning/10 text-warning'
            }`}>
              {network}
            </span>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 mt-3">
            {badgeTier && badgeTier !== 'none' && (
              <TierBadge tier={badgeTier as "bronze" | "silver" | "gold" | "diamond" | "legendary"} size="sm" />
            )}
            <div className="flex items-center gap-1.5">
              <ShieldIcon className="w-3.5 h-3.5 text-neon-green" />
              <span className="text-xs text-text-muted">Score:</span>
              <span className="text-xs font-semibold text-neon-green">{privacyScore || 0}</span>
            </div>
          </div>
        </div>

        {/* Mobile Balance */}
        <div className="sm:hidden px-3 py-2 border-b border-border-primary">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Balance</span>
            {balanceLoading ? (
              <span className="text-sm font-semibold text-text-muted animate-pulse">...</span>
            ) : (
              <span className="text-sm font-semibold text-neon-green">
                {balance.toFixed(4)} SOL
              </span>
            )}
          </div>
          {hiddenBalance > 0 && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-text-muted">Hidden</span>
              <span className="text-sm font-semibold text-neon-cyan">
                {hiddenBalance.toFixed(2)} SOL
              </span>
            </div>
          )}
        </div>

        {/* Feature Availability */}
        <div className="px-3 py-2 border-b border-border-primary">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            Available on {network}
          </p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(FEATURE_NETWORK_SUPPORT).map(([key, value]) => {
              const available = isFeatureAvailable(key as FeatureKey);
              return (
                <span
                  key={key}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    available
                      ? 'bg-neon-green/10 text-neon-green'
                      : 'bg-bg-tertiary text-text-muted line-through opacity-50'
                  }`}
                >
                  {value.label.split(' ')[0]}
                </span>
              );
            })}
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          <DropdownItem icon={<UserIcon />} onClick={() => router.push('/profile')}>
            Profile
          </DropdownItem>
          <DropdownItem icon={<SettingsIcon />} onClick={() => router.push('/settings')}>
            Settings
          </DropdownItem>
          <DropdownItem icon={<BookIcon />} onClick={() => router.push('/docs')}>
            Documentation
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem icon={<LogoutIcon />} variant="danger" onClick={onDisconnect}>
            Disconnect
          </DropdownItem>
        </div>
      </div>
    </Dropdown>
  );
}

// Icons
const MenuIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EyeOffIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpDownIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
  </svg>
);

const WalletIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);

const ShieldIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

const BookIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);
