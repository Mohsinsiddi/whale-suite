"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import WhaleLogo from "./WhaleLogo";

// Page names mapping
const PAGE_NAMES: Record<string, { name: string; icon: string; description: string }> = {
  "/": { name: "Home", icon: "🏠", description: "Landing page" },
  "/dashboard": { name: "Command Center", icon: "📊", description: "Your privacy dashboard" },
  "/privacy": { name: "Privacy Cash", icon: "🔒", description: "Hidden balance management" },
  "/transfer": { name: "Ghost Send", icon: "👻", description: "Private transfers" },
  "/swap": { name: "Jupiter Swap", icon: "🔄", description: "Token exchange" },
  "/vaults": { name: "Privacy Vaults", icon: "🏦", description: "Secure asset storage" },
  "/markets": { name: "PNP Markets", icon: "📈", description: "Prediction markets" },
  "/intelligence": { name: "Whale Intel", icon: "🐋", description: "Whale activity feed" },
  "/portfolio": { name: "Portfolio", icon: "💼", description: "Asset tracking" },
  "/cards": { name: "Virtual Cards", icon: "💳", description: "Privacy payments" },
  "/badges": { name: "NFT Badges", icon: "🏆", description: "Premium membership" },
  "/affiliate": { name: "Affiliate", icon: "🤝", description: "Referral program" },
  "/profile": { name: "Profile", icon: "👤", description: "Your account" },
  "/settings": { name: "Settings", icon: "⚙️", description: "Preferences" },
  "/connect": { name: "Connect", icon: "🔗", description: "Wallet connection" },
};

function getPageInfo(path: string) {
  if (PAGE_NAMES[path]) return PAGE_NAMES[path];
  const basePath = "/" + path.split("/")[1];
  if (PAGE_NAMES[basePath]) return PAGE_NAMES[basePath];
  return { name: "Loading", icon: "⏳", description: "Please wait..." };
}

export default function NavigationLoader() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const previousPathRef = useRef(pathname);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  }, []);

  // Start navigation
  const startNavigation = useCallback((url: string) => {
    if (url === pathname || url.startsWith("#")) return;

    cleanup();

    setTargetPath(url);
    setIsNavigating(true);
    setProgress(0);

    // Progress simulation with proper capping
    // Phase 1: Quick progress to 70%
    // Phase 2: Slower progress to 90%
    // Phase 3: Very slow progress to 98%
    // Phase 4: Crawl to 99% max
    // Only completeNavigation() sets 100%
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) return 99; // HARD CAP at 99 - never exceed
        if (prev >= 98) return 98 + (99 - 98) * 0.1; // Crawl: 98 -> 99
        if (prev >= 90) return prev + 0.3; // Very slow: 90 -> 98
        if (prev >= 70) return prev + 1; // Slow: 70 -> 90
        return prev + Math.random() * 8 + 4; // Fast: 0 -> 70
      });
    }, 150);

    // Safety timeout - force complete after 20 seconds
    safetyTimeoutRef.current = setTimeout(() => {
      completeNavigation();
    }, 20000);
  }, [pathname, cleanup]);

  // Complete navigation - ONLY place that sets 100%
  const completeNavigation = useCallback(() => {
    cleanup();

    // Animate to 100%
    setProgress(100);

    // Then hide after brief delay
    setTimeout(() => {
      setIsNavigating(false);
      setTargetPath(null);
      setProgress(0);
    }, 400);
  }, [cleanup]);

  // Listen for link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor && !anchor.hasAttribute("target")) {
        const href = anchor.getAttribute("href");
        if (href && href.startsWith("/") && !href.startsWith("//")) {
          startNavigation(href);
        }
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      cleanup();
    };
  }, [startNavigation, cleanup]);

  // Watch for pathname changes - this triggers 100%
  useEffect(() => {
    if (pathname !== previousPathRef.current) {
      previousPathRef.current = pathname;
      if (isNavigating) {
        completeNavigation();
      }
    }
  }, [pathname, isNavigating, completeNavigation]);

  const pageInfo = targetPath ? getPageInfo(targetPath) : null;

  // Get status message based on progress
  const getStatusMessage = (p: number) => {
    if (p < 20) return "Compiling page...";
    if (p < 40) return "Loading components...";
    if (p < 60) return "Fetching data...";
    if (p < 80) return "Rendering...";
    if (p < 95) return "Almost ready...";
    if (p < 100) return "Finishing up...";
    return "Complete!";
  };

  return (
    <AnimatePresence>
      {isNavigating && pageInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9998] bg-bg-primary/98 backdrop-blur-md flex flex-col items-center justify-center"
        >
          {/* Background grid */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0, 255, 136, 0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 255, 136, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          {/* Animated Logo */}
          <div className="relative mb-6">
            {/* Outer pulse */}
            <motion.div
              className="absolute -inset-4 sm:-inset-6 rounded-full border-2 border-neon-green/20"
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Spinning ring */}
            <motion.div
              className="absolute -inset-3 sm:-inset-4 rounded-full border-2 border-transparent border-t-neon-green border-r-neon-cyan"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner spinning ring (reverse) */}
            <motion.div
              className="absolute -inset-1.5 sm:-inset-2 rounded-full border border-transparent border-t-neon-cyan/60"
              animate={{ rotate: -360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />

            {/* Logo - responsive */}
            <WhaleLogo size="lg" showText={false} animated={true} className="sm:hidden" />
            <WhaleLogo size="xl" showText={false} animated={true} className="hidden sm:flex" />
          </div>

          {/* Page info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl">{pageInfo.icon}</span>
              <h2 className="text-2xl font-bold text-text-primary">{pageInfo.name}</h2>
            </div>
            <p className="text-sm text-text-muted">{pageInfo.description}</p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-72 sm:w-96"
          >
            <div className="relative h-2 bg-bg-secondary rounded-full overflow-hidden">
              {/* Glow */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green to-neon-cyan rounded-full blur-sm opacity-70 transition-all duration-200"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
              {/* Progress - NEVER exceeds 100% */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green rounded-full transition-all duration-200"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
              {/* Shimmer effect */}
              {progress < 100 && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>

            {/* Status */}
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-text-muted flex items-center gap-2">
                <motion.span
                  className="w-2 h-2 rounded-full bg-neon-green"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                {getStatusMessage(progress)}
              </span>
              {/* Display progress - capped at 100% */}
              <span className="text-xs text-neon-green font-mono font-bold">
                {Math.min(Math.round(progress), 100)}%
              </span>
            </div>
          </motion.div>

          {/* Path indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-8 px-4 py-2 rounded-full bg-bg-secondary/80 border border-border-primary"
          >
            <code className="text-xs text-neon-cyan/80 font-mono">
              → {targetPath}
            </code>
          </motion.div>

          {/* Tip */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-8 text-[10px] text-text-muted"
          >
            First load may take longer due to compilation
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Top progress bar variant
export function NavigationProgressBar() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const previousPathRef = useRef(pathname);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && href.startsWith("/") && href !== pathname) {
          setIsNavigating(true);
          setProgress(0);

          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(() => {
            setProgress(prev => {
              if (prev >= 99) return 99;
              if (prev >= 90) return prev + 0.5;
              return Math.min(prev + 10, 90);
            });
          }, 100);
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname !== previousPathRef.current) {
      previousPathRef.current = pathname;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
    }
  }, [pathname]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1">
      <div
        className="h-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all duration-100"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}

export function signalPageReady() {}
