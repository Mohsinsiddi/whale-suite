"use client";

import { motion } from "framer-motion";
import WhaleLogo from "@/components/ui/WhaleLogo";

export default function ConnectLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary">
      {/* Background Effects */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-radial opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated container */}
        <div className="relative mb-6">
          {/* Outer pulse */}
          <motion.div
            className="absolute -inset-6 rounded-full border-2 border-neon-green/20"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Spinning ring */}
          <motion.div
            className="absolute -inset-4 rounded-full border-2 border-transparent border-t-neon-green border-r-neon-cyan"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner spinning ring (reverse) */}
          <motion.div
            className="absolute -inset-2 rounded-full border border-transparent border-t-neon-cyan/60"
            animate={{ rotate: -360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />

          {/* Logo */}
          <WhaleLogo size="lg" showText={false} animated={true} />
        </div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-sm text-text-muted flex items-center gap-2">
            <motion.span
              className="w-2 h-2 rounded-full bg-neon-green"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            Preparing wallet connection...
          </p>
        </motion.div>
      </div>
    </div>
  );
}
