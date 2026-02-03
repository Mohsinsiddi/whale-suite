"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import WhaleLogo from "./WhaleLogo";

interface LoadingScreenProps {
  minDuration?: number; // Minimum display time in ms
  onLoadComplete?: () => void;
}

export default function LoadingScreen({
  minDuration = 2000,
  onLoadComplete
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing");

  useEffect(() => {
    const statusMessages = [
      "Initializing",
      "Loading Privacy Protocols",
      "Connecting to Solana",
      "Securing Connection",
      "Ready"
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          onLoadComplete?.();
        }, 500);
      }
      setProgress(Math.min(currentProgress, 100));

      // Update status text based on progress
      const statusIndex = Math.min(
        Math.floor(currentProgress / 25),
        statusMessages.length - 1
      );
      setStatusText(statusMessages[statusIndex]);
    }, minDuration / 10);

    return () => clearInterval(interval);
  }, [minDuration, onLoadComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-bg-primary flex flex-col items-center justify-center"
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite',
          }}
        />

        {/* Radial glow */}
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo with Rings */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-8">
          {/* Outer pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-neon-green/20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Spinning outer ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-transparent border-t-neon-green border-r-neon-cyan"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Spinning middle ring (reverse) */}
          <motion.div
            className="absolute inset-5 rounded-full border-2 border-transparent border-t-neon-cyan border-l-neon-green"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Spinning inner ring */}
          <motion.div
            className="absolute inset-8 rounded-full border border-transparent border-t-neon-green/60"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Center logo container - Using the same WhaleLogo component as header */}
          <div className="absolute inset-6 sm:inset-8 flex items-center justify-center">
            <WhaleLogo size="md" showText={false} animated={true} className="sm:hidden" />
            <WhaleLogo size="lg" showText={false} animated={true} className="hidden sm:flex" />
          </div>

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-neon-green"
              style={{
                left: `${50 + 45 * Math.cos((i * Math.PI * 2) / 6)}%`,
                top: `${50 + 45 * Math.sin((i * Math.PI * 2) / 6)}%`,
              }}
              animate={{
                scale: [0.5, 1, 0.5],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Brand text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            WHALE SUITE
          </h1>
          <p className="text-xs sm:text-sm text-text-muted tracking-[0.2em] uppercase mt-1">
            Privacy Protocol
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-64 sm:w-80"
        >
          <div className="relative h-1.5 bg-bg-secondary rounded-full overflow-hidden">
            {/* Glow layer */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green to-neon-cyan rounded-full blur-sm opacity-60"
              style={{ width: `${progress}%` }}
            />
            {/* Main progress */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green rounded-full"
              style={{
                width: `${progress}%`,
                backgroundSize: '200% 100%',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '200% 0%'],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Status text */}
          <div className="flex justify-between items-center mt-3">
            <motion.span
              className="text-xs text-text-muted flex items-center gap-2"
              key={statusText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              {statusText}...
            </motion.span>
            <span className="text-xs text-neon-green font-mono">{Math.round(progress)}%</span>
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-[10px] sm:text-xs text-text-muted/60 tracking-wider"
        >
          Privacy-First Trading on Solana
        </motion.p>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-neon-green/20 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-neon-green/20 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-neon-green/20 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-neon-green/20 rounded-br-lg" />
    </motion.div>
  );
}

// Hook to manage loading screen state
export function useLoadingScreen(initialLoading = true) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [hasShown, setHasShown] = useState(false);

  const handleLoadComplete = () => {
    setIsLoading(false);
    setHasShown(true);
  };

  return {
    isLoading,
    hasShown,
    setIsLoading,
    handleLoadComplete,
  };
}
