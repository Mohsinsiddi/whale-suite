"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TierBadge } from "../ui/Badge";
import { WalletAvatar } from "../ui/Avatar";
import WhaleLogo from "../ui/WhaleLogo";
import NetworkSelectModal from "../ui/NetworkSelectModal";
import { useUser, useWallet } from "@/store";
import { useNetwork, type FeatureKey } from "@/hooks/useNetwork";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useConfidentialBadge } from "@/hooks/useConfidentialBadge";
import { useAuth } from "@/lib/privy/hooks";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: string;
  badgeColor?: string;
  featureKey?: FeatureKey;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// Persist collapsed state
const COLLAPSED_KEY = "whale-sidebar-collapsed";
const CHANNELS_COLLAPSED_KEY = "whale-channels-collapsed";

// Sidebar widths
const SIDEBAR_EXPANDED = 280; // Wider for better readability
const SIDEBAR_COLLAPSED = 80; // Comfortable width for icons

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { userNumber, badgeTier, privacyScore } = useUser();
  const { wallet, hiddenBalance } = useWallet();
  const { network, rpcPing, isFeatureAvailable } = useNetwork();
  const { walletAddress } = useAuth();
  const { balance, loading: balanceLoading } = useWalletBalance(walletAddress);
  const { badge: confidentialBadge } = useConfidentialBadge();

  // Collapsed state for desktop toggle - default to false (expanded)
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Channels section collapsed state - default to false (expanded)
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  // Network modal state for desktop
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === "true") {
      setIsCollapsed(true);
    }
    const channelsStored = localStorage.getItem(CHANNELS_COLLAPSED_KEY);
    if (channelsStored === "false") {
      setChannelsExpanded(false);
    }
  }, []);

  // Toggle channels section
  const toggleChannelsSection = useCallback(() => {
    setChannelsExpanded((prev) => {
      const newValue = !prev;
      localStorage.setItem(CHANNELS_COLLAPSED_KEY, String(newValue));
      return newValue;
    });
  }, []);

  // Toggle collapsed state and dispatch event for DashboardLayout
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(newValue));
      // Dispatch custom event for DashboardLayout to listen
      window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed: newValue } }));
      return newValue;
    });
  }, []);

  // Format wallet address for display
  const shortWallet = wallet
    ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
    : "...";

  // State for joined channels from API
  const [joinedChannels, setJoinedChannels] = useState<string[]>([]);

  // Fetch joined channels
  useEffect(() => {
    if (!walletAddress) return;

    const fetchJoined = async () => {
      try {
        const res = await fetch(`/api/channels?wallet=${walletAddress}`);
        if (res.ok) {
          const data = await res.json();
          const joined = data.channels
            ?.filter((c: { userAccess: string }) => c.userAccess === 'joined')
            ?.map((c: { slug: string }) => c.slug) || [];
          setJoinedChannels(joined);
        }
      } catch {
        // Silently fail
      }
    };
    fetchJoined();
  }, [walletAddress]);

  // Generate channel items based on badge status and joined channels
  const getChannelItems = useCallback((): { hub: NavItem; joined: NavItem[]; comingSoon: NavItem[] } => {
    // Hub link - always shown
    const hub: NavItem = {
      href: "/channels",
      icon: <ChannelsIcon />,
      label: "All Channels",
      badge: !confidentialBadge?.hasClaimed ? "Join" : undefined,
      badgeColor: "cyan"
    };

    // Joined channels
    const joined: NavItem[] = [];

    // Channel definitions (only show tier 1-3, 4-5 are mainnet only)
    const channelDefs = [
      { tier: 1, slug: "bronze-lounge", href: "/channels/bronze-lounge", icon: "🥉", label: "Bronze Lounge" },
      { tier: 2, slug: "silver-circle", href: "/channels/silver-circle", icon: "🥈", label: "Silver Circle" },
      { tier: 3, slug: "gold-vault", href: "/channels/gold-vault", icon: "🥇", label: "Gold Vault" },
    ];

    // Only show JOINED channels
    if (confidentialBadge?.hasClaimed) {
      for (const ch of channelDefs) {
        if (joinedChannels.includes(ch.slug)) {
          joined.push({
            href: ch.href,
            icon: <span className="text-sm">{ch.icon}</span>,
            label: ch.label,
          });
        }
      }
    }

    // Coming Soon items (Diamond and Legendary - always disabled)
    const comingSoon: NavItem[] = [
      {
        href: "#",
        icon: <span className="text-sm opacity-40">💎</span>,
        label: "Diamond Den",
        badge: "Soon",
        badgeColor: "default",
      },
      {
        href: "#",
        icon: <span className="text-sm opacity-40">👑</span>,
        label: "Legendary",
        badge: "Soon",
        badgeColor: "default",
      },
    ];

    return { hub, joined, comingSoon };
  }, [confidentialBadge, joinedChannels]);

  // Get channel data
  const channelData = useMemo(() => getChannelItems(), [getChannelItems]);

  // Sort items within each group: available first, then unavailable
  // Note: Channels group is rendered separately with collapsible logic
  const navGroups = useMemo(() => {
    const baseNavGroups: NavGroup[] = [
      {
        title: "Overview",
        items: [
          { href: "/dashboard", icon: <DashboardIcon />, label: "Command Center" },
        ],
      },
      {
        title: "Privacy Tools",
        items: [
          { href: "/privacy", icon: <ShieldIcon />, label: "Privacy Cash", featureKey: 'privacy-cash' },
          { href: "/transfer", icon: <GhostIcon />, label: "Ghost Send", featureKey: 'shadow-wire' },
          { href: "/swap", icon: <SwapIcon />, label: "Jupiter Swap", featureKey: 'jupiter-swap' },
          { href: "/private-swap", icon: <PrivateSwapIcon />, label: "Private Swap", badge: "ZK", badgeColor: "cyan", featureKey: 'darklake' },
          { href: "/private-payments", icon: <LockIcon />, label: "Private Payments", badge: "INCO", badgeColor: "cyan", featureKey: 'private-payments' as FeatureKey },
          { href: "/dark-pool", icon: <DarkPoolIcon />, label: "Dark Pool", badge: "Beta", badgeColor: "warning", featureKey: 'dark-pool' },
        ],
      },
      {
        title: "Predictions",
        items: [
          { href: "/markets", icon: <MarketsIcon />, label: "PNP Markets", featureKey: 'pnp-markets' },
        ],
      },
      {
        title: "Intelligence",
        items: [
          { href: "/intelligence", icon: <IntelligenceIcon />, label: "Whale Intel", featureKey: 'whale-feed' },
          { href: "/portfolio", icon: <PortfolioIcon />, label: "Portfolio" },
        ],
      },
      {
        title: "Payments",
        items: [
          { href: "/cards", icon: <CardsIcon />, label: "Virtual Cards", badge: "New", badgeColor: "cyan", featureKey: 'virtual-cards' as FeatureKey },
        ],
      },
      {
        title: "Launch",
        items: [
          { href: "/launch", icon: <RocketIcon />, label: "Token Launcher", badge: "$10K", badgeColor: "cyan" },
        ],
      },
      {
        title: "Premium",
        items: [
          { href: "/badges", icon: <BadgeIcon />, label: "NFT Badges" },
          { href: "/affiliate", icon: <AffiliateIcon />, label: "Affiliate", badge: "Soon", badgeColor: "default" },
        ],
      },
      {
        title: "Help",
        items: [
          { href: "/docs", icon: <DocsIcon />, label: "Points & Docs" },
        ],
      },
    ];

    return baseNavGroups.map(group => ({
      ...group,
      items: [...group.items].sort((a, b) => {
        const aAvailable = a.featureKey ? isFeatureAvailable(a.featureKey) : true;
        const bAvailable = b.featureKey ? isFeatureAvailable(b.featureKey) : true;
        if (aAvailable && !bAvailable) return -1;
        if (!aAvailable && bAvailable) return 1;
        return 0;
      }),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]);

  const bottomItems = [
    { href: "/profile", icon: <ProfileIcon />, label: "Profile" },
    { href: "/donate", icon: <DonateIcon />, label: "Donate" },
    { href: "/settings", icon: <SettingsIcon />, label: "Settings" },
  ];

  // Current sidebar width
  const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          bg-bg-secondary/95 backdrop-blur-xl border-r border-border-primary
          transform transition-transform duration-300 ease-out
          lg:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <Link href="/" className="flex items-center">
            <WhaleLogo size="sm" showText={true} animated={false} />
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <CloseIcon className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Mobile Nav Content */}
        <MobileSidebarContent
          navGroups={navGroups}
          channelData={channelData}
          bottomItems={bottomItems}
          pathname={pathname}
          userNumber={userNumber}
          badgeTier={badgeTier}
          privacyScore={privacyScore}
          shortWallet={shortWallet}
          network={network}
          rpcPing={rpcPing}
          isFeatureAvailable={isFeatureAvailable}
          onClose={onClose}
          balance={balance}
          balanceLoading={balanceLoading}
          hiddenBalance={hiddenBalance}
          walletAddress={walletAddress}
        />
      </aside>

      {/* Desktop Sidebar - Always visible */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:flex fixed top-14 left-0 z-40 h-[calc(100vh-56px)] bg-bg-secondary/95 backdrop-blur-xl border-r border-border-primary flex-col overflow-visible"
      >
        {/* Desktop Toggle Button */}
        <motion.button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-6 z-50 w-6 h-6 rounded-full bg-bg-tertiary border border-border-primary flex items-center justify-center hover:bg-neon-green/10 hover:border-neon-green/30 transition-colors group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeftIcon className="w-3 h-3 text-text-muted group-hover:text-neon-green transition-colors" />
          </motion.div>
        </motion.button>

        {/* User Card */}
        <div className={`p-3 ${isCollapsed ? 'px-2' : 'p-4'}`}>
          <UserCardWithTooltip
            isCollapsed={isCollapsed}
            userNumber={userNumber}
            badgeTier={badgeTier}
            shortWallet={shortWallet}
            privacyScore={privacyScore}
            walletAddress={walletAddress}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto overflow-x-visible scrollbar-thin scrollbar-thumb-border-primary scrollbar-track-transparent">
          {navGroups.map((group, groupIndex) => (
            <div key={group.title}>
              {/* Render normal group */}
              <div className={groupIndex > 0 ? "mt-4" : ""}>
                {/* Section Label */}
                <AnimatePresence mode="wait">
                  {!isCollapsed ? (
                    <motion.div
                      key="label"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-3 mb-2"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted/70">
                        {group.title}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="divider"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-3 mb-2"
                    >
                      <div className="h-px bg-border-secondary/30" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Section Items */}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isAvailable = item.featureKey ? isFeatureAvailable(item.featureKey) : true;
                    return (
                      <DesktopSidebarLink
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        badge={item.badge}
                        badgeColor={item.badgeColor}
                        isActive={pathname === item.href}
                        isDisabled={!isAvailable}
                        isCollapsed={isCollapsed}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Insert Channels section after Privacy Tools */}
              {group.title === "Privacy Tools" && (
                <div className="mt-4">
                  {/* Collapsible Channels Header */}
                  <AnimatePresence mode="wait">
                    {!isCollapsed ? (
                      <motion.div
                        key="channels-label"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-3 mb-2"
                      >
                        <button
                          onClick={toggleChannelsSection}
                          className="flex items-center justify-between w-full group"
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted/70 group-hover:text-neon-green transition-colors">
                            Channels
                          </span>
                          <motion.div
                            animate={{ rotate: channelsExpanded ? 0 : -90 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDownIcon className="w-3 h-3 text-text-muted/50 group-hover:text-neon-green transition-colors" />
                          </motion.div>
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="channels-divider"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-3 mb-2"
                      >
                        <div className="h-px bg-border-secondary/30" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Channel Items */}
                  <AnimatePresence>
                    {(channelsExpanded || isCollapsed) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-0.5 overflow-hidden"
                      >
                        {/* Hub Link */}
                        <DesktopSidebarLink
                          href={channelData.hub.href}
                          icon={channelData.hub.icon}
                          label={channelData.hub.label}
                          badge={channelData.hub.badge}
                          badgeColor={channelData.hub.badgeColor}
                          isActive={pathname === channelData.hub.href}
                          isCollapsed={isCollapsed}
                        />

                        {/* Joined Channels */}
                        {channelData.joined.map((item) => (
                          <DesktopSidebarLink
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                            isActive={pathname === item.href}
                            isCollapsed={isCollapsed}
                          />
                        ))}

                        {/* Coming Soon Channels */}
                        {channelData.comingSoon.map((item) => (
                          <DesktopSidebarLink
                            key={item.label}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                            badge={item.badge}
                            badgeColor={item.badgeColor}
                            isActive={false}
                            isDisabled={true}
                            isCollapsed={isCollapsed}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ))}

          {/* Divider */}
          <div className="my-4 h-px bg-border-secondary/50" />

          {/* Bottom Items */}
          <div className="space-y-0.5">
            {bottomItems.map((item) => (
              <DesktopSidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </nav>

        {/* Stealth Rating */}
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 border-t border-border-primary bg-bg-primary/30"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted">Stealth Rating</span>
                <span className="text-xs font-bold text-neon-green">
                  {privacyScore || 0}/1000
                </span>
              </div>
              <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${(privacyScore / 1000) * 100}%` }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </motion.div>
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                Use privacy tools to increase your rating
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="compact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 border-t border-border-primary bg-bg-primary/30"
            >
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-bg-tertiary border border-border-primary flex items-center justify-center relative overflow-hidden">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(0,255,136,0.1)" strokeWidth="3" />
                    <motion.circle
                      cx="24" cy="24" r="20"
                      fill="none"
                      stroke="url(#stealthGrad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={125.6}
                      initial={{ strokeDashoffset: 125.6 }}
                      animate={{ strokeDashoffset: 125.6 - (privacyScore / 1000) * 125.6 }}
                      transition={{ duration: 0.5 }}
                    />
                    <defs>
                      <linearGradient id="stealthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00ff88" />
                        <stop offset="100%" stopColor="#00d4ff" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-[10px] font-bold text-neon-green relative z-10">
                    {Math.round((privacyScore / 1000) * 100)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Network Toggle - Desktop */}
        <div className={`px-4 pb-2 ${isCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={() => setShowNetworkModal(true)}
            className={`w-full flex items-center gap-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.01] ${
              isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
            } ${
              network === 'mainnet'
                ? 'bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/15 hover:border-neon-green/50'
                : 'bg-warning/10 text-warning border border-warning/30 hover:bg-warning/15 hover:border-warning/50'
            }`}
          >
            {/* Network indicator */}
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              network === 'mainnet' ? 'bg-neon-green' : 'bg-warning'
            } ${rpcPing !== null && rpcPing >= 0 ? 'animate-pulse' : ''}`} />

            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center justify-between flex-1 min-w-0"
                >
                  {/* Network name */}
                  <span className="font-semibold">
                    {network === 'mainnet' ? 'Mainnet' : 'Devnet'}
                  </span>

                  {/* Ping indicator */}
                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                    rpcPing === null
                      ? 'bg-bg-tertiary text-text-muted'
                      : rpcPing < 0
                      ? 'bg-error/20 text-error'
                      : rpcPing < 200
                      ? 'bg-neon-green/20 text-neon-green'
                      : rpcPing < 500
                      ? 'bg-warning/20 text-warning'
                      : 'bg-error/20 text-error'
                  }`}>
                    <SignalIcon className="w-2.5 h-2.5" />
                    {rpcPing === null ? '...' : rpcPing < 0 ? 'err' : `${rpcPing}ms`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Version Badge */}
        <div className="px-4 pb-4">
          <div className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] text-text-muted transition-all bg-bg-tertiary/30 border border-border-primary`}>
            <AnimatePresence mode="wait">
              {!isCollapsed ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap text-text-muted"
                >
                  Whale Suite v1.0.0
                </motion.span>
              ) : (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-text-muted"
                >
                  v1
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Network Select Modal - Desktop */}
        <NetworkSelectModal
          isOpen={showNetworkModal}
          onClose={() => setShowNetworkModal(false)}
        />
      </motion.aside>
    </>
  );
}

// Mobile sidebar content (full width, no collapse)
// User Card with Tooltip for collapsed state
function UserCardWithTooltip({
  isCollapsed,
  userNumber,
  badgeTier,
  shortWallet,
  walletAddress,
}: {
  isCollapsed: boolean;
  userNumber: number | null;
  badgeTier: string;
  shortWallet: string;
  privacyScore: number;
  walletAddress: string | null;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (isCollapsed) {
    return (
      <div
        className="relative flex justify-center group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Collapsed Avatar - Using WalletAvatar */}
        <div className="cursor-pointer hover:scale-105 transition-transform">
          <WalletAvatar
            address={walletAddress || "0x0000"}
            size="lg"
            showAddress={false}
          />
        </div>

        {/* Simple Tooltip */}
        {showTooltip && (
          <div className="fixed left-[92px] z-[100] bg-bg-elevated border border-border-primary rounded-lg shadow-xl py-2 px-3 whitespace-nowrap">
            <p className="text-sm font-medium text-text-primary">
              {userNumber ? `Whale #${userNumber}` : 'New Whale'}
            </p>
            <p className="text-xs text-text-muted font-mono">{shortWallet}</p>
            {badgeTier && badgeTier !== 'none' && (
              <p className="text-xs text-neon-green mt-1 capitalize">{badgeTier} Badge</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Expanded state
  return (
    <div className="p-3 rounded-xl bg-gradient-to-br from-bg-tertiary to-bg-elevated border border-border-primary hover:border-neon-green/30 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <WalletAvatar
          address={walletAddress || "0x0000"}
          size="lg"
          showAddress={false}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {userNumber ? `Whale #${userNumber}` : 'New Whale'}
          </p>
          <p className="text-xs text-text-muted font-mono">{shortWallet}</p>
        </div>
      </div>
      {badgeTier && badgeTier !== 'none' && (
        <TierBadge tier={badgeTier as "bronze" | "silver" | "gold" | "diamond" | "legendary"} size="sm" />
      )}
    </div>
  );
}

function MobileSidebarContent({
  navGroups,
  channelData,
  bottomItems,
  pathname,
  userNumber,
  badgeTier,
  privacyScore,
  shortWallet,
  network,
  rpcPing,
  isFeatureAvailable,
  onClose,
  balance,
  balanceLoading,
  hiddenBalance,
  walletAddress,
}: {
  navGroups: NavGroup[];
  channelData: { hub: NavItem; joined: NavItem[]; comingSoon: NavItem[] };
  bottomItems: { href: string; icon: ReactNode; label: string }[];
  pathname: string;
  userNumber: number | null;
  badgeTier: string;
  privacyScore: number;
  shortWallet: string;
  network: 'mainnet' | 'devnet';
  rpcPing: number | null;
  isFeatureAvailable: (key: FeatureKey) => boolean;
  onClose?: () => void;
  balance: number;
  balanceLoading: boolean;
  hiddenBalance: number;
  walletAddress: string | null;
}) {
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [mobileChannelsExpanded, setMobileChannelsExpanded] = useState(true);

  const pingStatus = rpcPing === null
    ? 'loading'
    : rpcPing < 0
    ? 'error'
    : rpcPing < 200
    ? 'excellent'
    : rpcPing < 500
    ? 'good'
    : 'slow';

  return (
    <>
      {/* User Card */}
      <div className="p-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-bg-tertiary to-bg-elevated border border-border-primary">
          <div className="flex items-center gap-3 mb-2">
            <WalletAvatar
              address={walletAddress || "0x0000"}
              size="lg"
              showAddress={false}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {userNumber ? `Whale #${userNumber}` : 'New Whale'}
              </p>
              <p className="text-xs text-text-muted font-mono">{shortWallet}</p>
            </div>
          </div>
          {badgeTier && badgeTier !== 'none' && (
            <TierBadge tier={badgeTier as "bronze" | "silver" | "gold" | "diamond" | "legendary"} size="sm" />
          )}
        </div>
      </div>

      {/* Network Switch - Mobile */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setShowNetworkModal(true)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            network === 'mainnet'
              ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
              : 'bg-warning/10 text-warning border border-warning/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${network === 'mainnet' ? 'bg-neon-green' : 'bg-warning'} animate-pulse`} />
            <span className="font-semibold">{network === 'mainnet' ? 'Mainnet' : 'Devnet'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded ${
              pingStatus === 'loading' ? 'bg-bg-tertiary text-text-muted'
              : pingStatus === 'error' ? 'bg-error/20 text-error'
              : pingStatus === 'excellent' ? 'bg-neon-green/20 text-neon-green'
              : 'bg-warning/20 text-warning'
            }`}>
              {pingStatus === 'loading' ? '...' : pingStatus === 'error' ? 'Error' : `${rpcPing}ms`}
            </span>
            <ChevronRightIcon className="w-4 h-4 opacity-50" />
          </div>
        </button>
      </div>

      {/* Balance Card - Mobile (Compact) */}
      <div className="px-4 pb-2">
        <div className="px-3 py-2 rounded-lg bg-bg-tertiary/50 border border-border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
                <span className="text-[10px]">◎</span>
              </div>
              {balanceLoading ? (
                <span className="text-xs font-semibold text-text-muted animate-pulse">...</span>
              ) : (
                <span className="text-xs font-bold text-text-primary">{balance.toFixed(4)} SOL</span>
              )}
              {hiddenBalance > 0 && (
                <span className="text-[10px] text-neon-cyan">+{hiddenBalance.toFixed(2)} hidden</span>
              )}
            </div>
            <span className="text-xs font-bold text-neon-green">
              ${((balance + hiddenBalance) * 230).toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title}>
            <div className={groupIndex > 0 ? "mt-4" : ""}>
              <div className="px-3 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted/70">
                  {group.title}
                </span>
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isAvailable = item.featureKey ? isFeatureAvailable(item.featureKey) : true;
                  return (
                    <MobileSidebarLink
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      badge={item.badge}
                      badgeColor={item.badgeColor}
                      isActive={pathname === item.href}
                      isDisabled={!isAvailable}
                      network={network}
                      onClick={onClose}
                    />
                  );
                })}
              </div>
            </div>

            {/* Insert Channels section after Privacy Tools */}
            {group.title === "Privacy Tools" && (
              <div className="mt-4">
                {/* Collapsible Channels Header */}
                <div className="px-3 mb-2">
                  <button
                    onClick={() => setMobileChannelsExpanded(!mobileChannelsExpanded)}
                    className="flex items-center justify-between w-full group"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted/70 group-hover:text-neon-green transition-colors">
                      Channels
                    </span>
                    <motion.div
                      animate={{ rotate: mobileChannelsExpanded ? 0 : -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDownIcon className="w-3 h-3 text-text-muted/50 group-hover:text-neon-green transition-colors" />
                    </motion.div>
                  </button>
                </div>

                {/* Channel Items */}
                <AnimatePresence>
                  {mobileChannelsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-0.5 overflow-hidden"
                    >
                      {/* Hub Link */}
                      <MobileSidebarLink
                        href={channelData.hub.href}
                        icon={channelData.hub.icon}
                        label={channelData.hub.label}
                        badge={channelData.hub.badge}
                        badgeColor={channelData.hub.badgeColor}
                        isActive={pathname === channelData.hub.href}
                        onClick={onClose}
                      />

                      {/* Joined Channels */}
                      {channelData.joined.map((item) => (
                        <MobileSidebarLink
                          key={item.href}
                          href={item.href}
                          icon={item.icon}
                          label={item.label}
                          isActive={pathname === item.href}
                          onClick={onClose}
                        />
                      ))}

                      {/* Coming Soon Channels */}
                      {channelData.comingSoon.map((item) => (
                        <MobileSidebarLink
                          key={item.label}
                          href={item.href}
                          icon={item.icon}
                          label={item.label}
                          badge={item.badge}
                          badgeColor={item.badgeColor}
                          isActive={false}
                          isDisabled={true}
                          network={network}
                          onClick={onClose}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        ))}

        <div className="my-4 h-px bg-border-secondary/50" />

        <div className="space-y-0.5">
          {bottomItems.map((item) => (
            <MobileSidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
              onClick={onClose}
            />
          ))}
        </div>
      </nav>

      {/* Stealth Rating */}
      <div className="p-4 border-t border-border-primary bg-bg-primary/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-muted">Stealth Rating</span>
          <span className="text-xs font-bold text-neon-green">{privacyScore || 0}/1000</span>
        </div>
        <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green rounded-full relative"
            style={{ width: `${(privacyScore / 1000) * 100}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="px-4 pb-4">
        <div className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] ${
          network === 'mainnet'
            ? 'bg-neon-green/5 border border-neon-green/20 text-neon-green'
            : 'bg-warning/5 border border-warning/20 text-warning'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            network === 'mainnet' ? 'bg-neon-green' : 'bg-warning'
          }`} />
          {network === 'mainnet' ? 'Mainnet' : 'Devnet'}
          <span className="text-text-muted/50">|</span>
          <span className="text-text-muted">v1.0.0</span>
        </div>
      </div>

      {/* Network Select Modal */}
      <NetworkSelectModal
        isOpen={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
      />
    </>
  );
}

// Mobile Sidebar Link
function MobileSidebarLink({
  href,
  icon,
  label,
  badge,
  badgeColor = "green",
  isActive,
  isDisabled,
  network,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: string;
  badgeColor?: string;
  isActive?: boolean;
  isDisabled?: boolean;
  network?: 'mainnet' | 'devnet';
  onClick?: () => void;
}) {
  if (isDisabled) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted/50 opacity-50 cursor-not-allowed"
        title={`Not available on ${network}`}
      >
        <span className="text-text-muted/40">{icon}</span>
        <span className="flex-1 line-through">{label}</span>
        {badge && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-bg-tertiary/50 text-text-muted/50">{badge}</span>}
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? "bg-neon-green/10 text-neon-green border-l-2 border-neon-green"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/70 border-l-2 border-transparent"
      }`}
    >
      <span className={isActive ? "text-neon-green" : "text-text-muted"}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
          badgeColor === "green" ? "bg-neon-green/20 text-neon-green"
          : badgeColor === "cyan" ? "bg-neon-cyan/20 text-neon-cyan"
          : "bg-warning/20 text-warning"
        }`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

// Desktop Sidebar Link with tooltip on collapse
function DesktopSidebarLink({
  href,
  icon,
  label,
  badge,
  badgeColor = "green",
  isActive,
  isDisabled,
  isCollapsed,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: string;
  badgeColor?: string;
  isActive?: boolean;
  isDisabled?: boolean;
  isCollapsed?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Get badge color classes
  const getBadgeClasses = (color: string) => {
    switch (color) {
      case "green": return "bg-neon-green/20 text-neon-green";
      case "cyan": return "bg-neon-cyan/20 text-neon-cyan";
      default: return "bg-warning/20 text-warning";
    }
  };

  if (isDisabled) {
    return (
      <div
        className={`group flex items-center gap-3 rounded-lg text-sm font-medium text-text-muted/50 opacity-60 cursor-not-allowed ${
          isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-text-muted/40 flex-shrink-0">{icon}</span>
        {!isCollapsed && (
          <>
            <span className="flex-1 line-through">{label}</span>
            {badge && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-bg-tertiary/50 text-text-muted/50">{badge}</span>}
          </>
        )}
        {/* Simple Tooltip */}
        {isCollapsed && showTooltip && (
          <div className="fixed left-[92px] z-[100] bg-bg-elevated border border-border-primary rounded-lg shadow-lg py-1.5 px-3 whitespace-nowrap">
            <span className="text-xs text-text-muted line-through">{label}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
        isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
      } ${
        isActive
          ? "bg-neon-green/10 text-neon-green"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50"
      }`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={`flex-shrink-0 transition-colors ${isActive ? "text-neon-green" : "text-text-muted group-hover:text-neon-green"}`}>
        {icon}
      </span>
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!isCollapsed && badge && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`px-1.5 py-0.5 text-[9px] font-bold rounded flex-shrink-0 ${getBadgeClasses(badgeColor)}`}
          >
            {badge}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Simple Tooltip on collapse */}
      {isCollapsed && showTooltip && (
        <div className="fixed left-[92px] z-[100] bg-bg-elevated border border-border-primary rounded-lg shadow-lg py-1.5 px-3 whitespace-nowrap flex items-center gap-2">
          <span className={`text-xs font-medium ${isActive ? 'text-neon-green' : 'text-text-primary'}`}>{label}</span>
          {badge && (
            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${getBadgeClasses(badgeColor)}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

// Icons
const CloseIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronRightIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronLeftIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const DashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const GhostIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const SwapIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const DarkPoolIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const PrivateSwapIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2m0 14v2m-7-9H3m18 0h-2" />
  </svg>
);

const MarketsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

const IntelligenceIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PortfolioIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const BadgeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
  </svg>
);

const AffiliateIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const CardsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

const ProfileIcon = () => (
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

const DonateIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const RocketIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const DocsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const ChannelsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
  </svg>
);

const SignalIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546" />
  </svg>
);
