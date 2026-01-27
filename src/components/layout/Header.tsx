"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { WalletAvatar } from "../ui/Avatar";
import Dropdown, { DropdownItem, DropdownDivider } from "../ui/Dropdown";
import { CountBadge, TierBadge } from "../ui/Badge";
import { useAuth } from "@/lib/privy/hooks";
import { useUser, useWallet, useUI } from "@/store";
import { useWalletBalance } from "@/hooks/useWalletBalance";

interface HeaderProps {
  variant?: "landing" | "app";
  wallet?: string;
  notifications?: number;
}

export default function Header({ variant = "landing", wallet, notifications = 0 }: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, walletAddress, authenticated, login } = useAuth();
  const { userNumber, badgeTier, privacyScore } = useUser();
  const { hiddenBalance } = useWallet();
  const { toggleSidebar } = useUI();

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
      // Clear all local storage
      localStorage.removeItem('whale-suite-welcome-seen');
      localStorage.removeItem('whale-suite-storage');
      // Force full page reload to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload anyway
      window.location.href = '/';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-border-primary">
      <div className="max-w-7xl mx-auto px-4 lg:pl-64">
        <div className="flex items-center justify-between h-14">
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

            <Link href={variant === "app" ? "/dashboard" : "/"} className="flex items-center gap-2">
              <span className="text-lg">🐋</span>
              <span className="font-bold text-base bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent hidden sm:block">
                WHALE SUITE
              </span>
            </Link>
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
                {/* Balance Display */}
                <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-primary">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-text-muted">Balance:</span>
                    {balanceLoading ? (
                      <span className="text-sm font-semibold text-text-muted animate-pulse">...</span>
                    ) : (
                      <span className="text-sm font-semibold text-neon-green">
                        {balance.toFixed(4)} SOL
                      </span>
                    )}
                  </div>
                  {hiddenBalance > 0 && (
                    <>
                      <div className="w-px h-4 bg-border-primary" />
                      <div className="flex items-center gap-1.5">
                        <EyeOffIcon className="w-3 h-3 text-neon-cyan" />
                        <span className="text-sm font-semibold text-neon-cyan">
                          {hiddenBalance.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Disconnect Button */}
                <button
                  onClick={handleDisconnect}
                  className="p-2 rounded-lg hover:bg-error/10 transition-colors group"
                  title="Disconnect Wallet"
                >
                  <DisconnectIcon className="w-4 h-4 text-text-muted group-hover:text-error" />
                </button>

                {/* Notifications */}
                <Dropdown
                  trigger={
                    <button className="relative p-2 rounded-lg hover:bg-bg-tertiary transition-colors">
                      <BellIcon className="w-4 h-4 text-text-secondary" />
                      {notifications > 0 && (
                        <span className="absolute -top-0.5 -right-0.5">
                          <CountBadge count={notifications} />
                        </span>
                      )}
                    </button>
                  }
                >
                  <div className="w-72 p-2">
                    <p className="text-xs font-semibold text-text-muted px-2 py-1">Notifications</p>
                    <div className="mt-2 space-y-1">
                      <NotificationItem
                        title="Transfer Complete"
                        message="50 SOL sent privately"
                        time="2m ago"
                      />
                      <NotificationItem
                        title="Whale Alert"
                        message="Large deposit detected in pool"
                        time="15m ago"
                      />
                    </div>
                  </div>
                </Dropdown>

                {/* Profile Dropdown */}
                <Dropdown
                  trigger={
                    <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors border border-transparent hover:border-border-primary">
                      <WalletAvatar address={displayWallet || "0x0000"} size="sm" showAddress={false} />
                      <div className="hidden sm:flex flex-col items-start">
                        <span className="text-xs font-medium text-text-primary">
                          {userNumber ? `Whale #${userNumber}` : shortWallet}
                        </span>
                        <span className="text-[10px] text-text-muted">{shortWallet}</span>
                      </div>
                      <ChevronDownIcon className="w-3 h-3 text-text-muted" />
                    </button>
                  }
                >
                  {/* User Info Header */}
                  <div className="px-3 py-2 border-b border-border-primary">
                    <div className="flex items-center gap-2">
                      <WalletAvatar address={displayWallet || "0x0000"} size="md" showAddress={false} />
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {userNumber ? `Whale #${userNumber}` : 'New Whale'}
                        </p>
                        <p className="text-xs text-text-muted">{shortWallet}</p>
                      </div>
                    </div>
                    {badgeTier && badgeTier !== 'none' && (
                      <div className="mt-2">
                        <TierBadge tier={badgeTier as "bronze" | "silver" | "gold" | "diamond" | "legendary"} size="sm" />
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="text-text-muted">Privacy Score:</span>
                      <span className="font-semibold text-neon-green">{privacyScore || 0}</span>
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

                  <DropdownItem icon={<UserIcon />} onClick={() => router.push('/profile')}>
                    Profile
                  </DropdownItem>
                  <DropdownItem icon={<SettingsIcon />} onClick={() => router.push('/settings')}>
                    Settings
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem icon={<LogoutIcon />} variant="danger" onClick={handleDisconnect}>
                    Disconnect
                  </DropdownItem>
                </Dropdown>
              </>
            ) : (
              /* Connect Wallet Button for unauthenticated users */
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
      </div>

      {/* Mobile Menu (Landing) */}
      {mobileMenuOpen && variant === "landing" && (
        <div className="md:hidden border-t border-border-primary bg-bg-primary/95 backdrop-blur-xl">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
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
            <Link
              href="/docs"
              className="px-3 py-2 text-sm text-text-secondary hover:text-neon-green transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

// Notification Item
function NotificationItem({ title, message, time }: { title: string; message: string; time: string }) {
  return (
    <div className="px-2 py-2 rounded-lg hover:bg-bg-elevated transition-colors cursor-pointer">
      <div className="flex justify-between items-start">
        <p className="text-xs font-medium text-text-primary">{title}</p>
        <span className="text-[10px] text-text-muted">{time}</span>
      </div>
      <p className="text-xs text-text-secondary mt-0.5">{message}</p>
    </div>
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

const BellIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
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

const DisconnectIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
  </svg>
);
