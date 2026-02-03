"use client";

import { motion } from "framer-motion";
import WhaleLogo from "@/components/ui/WhaleLogo";

// Root loading.tsx - shows when navigating to landing page
export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary">
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

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated container */}
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
          <WhaleLogo size="md" showText={false} animated={true} className="sm:hidden" />
          <WhaleLogo size="lg" showText={false} animated={true} className="hidden sm:flex" />
        </div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-xl font-bold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent mb-2">
            WHALE SUITE
          </h2>
          <p className="text-sm text-text-muted flex items-center justify-center gap-2">
            <motion.span
              className="w-2 h-2 rounded-full bg-neon-green"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            Loading...
          </p>
        </motion.div>
      </div>
    </div>
  );
}
