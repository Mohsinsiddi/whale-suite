"use client";

import { motion } from "framer-motion";

interface WhaleLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
  collapsed?: boolean;
  className?: string;
}

const sizeConfig = {
  xs: { icon: 24, text: "text-xs" },
  sm: { icon: 32, text: "text-sm" },
  md: { icon: 40, text: "text-base" },
  lg: { icon: 48, text: "text-lg" },
  xl: { icon: 64, text: "text-xl" },
};

export default function WhaleLogo({
  size = "md",
  showText = true,
  animated = true,
  collapsed = false,
  className = "",
}: WhaleLogoProps) {
  const { icon: iconSize, text: textSize } = sizeConfig[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Animated Whale Icon */}
      <motion.div
        className="relative flex-shrink-0"
        whileHover={animated ? { scale: 1.05 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        {/* Glow effect */}
        <div
          className="absolute rounded-xl blur-xl opacity-60"
          style={{
            width: iconSize + 12,
            height: iconSize + 12,
            left: -6,
            top: -6,
            background: "linear-gradient(135deg, rgba(0,255,136,0.4) 0%, rgba(0,212,255,0.4) 100%)",
          }}
        />

        {/* Main icon container */}
        <motion.div
          className="relative rounded-xl bg-gradient-to-br from-neon-green via-neon-cyan to-neon-green p-[2px] overflow-hidden"
          style={{ width: iconSize + 4, height: iconSize + 4 }}
          animate={animated ? {
            background: [
              "linear-gradient(135deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%)",
              "linear-gradient(225deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%)",
              "linear-gradient(315deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%)",
              "linear-gradient(135deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%)",
            ],
          } : undefined}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="w-full h-full rounded-[10px] bg-bg-primary flex items-center justify-center overflow-hidden"
          >
            {/* Whale SVG - Side View Silhouette */}
            <motion.svg
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: iconSize - 4, height: iconSize - 4 }}
              animate={animated ? { y: [0, -1, 0] } : undefined}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Water spout */}
              <motion.g
                initial={{ opacity: 0, y: 5 }}
                animate={animated ? { opacity: [0, 1, 1, 0], y: [5, 0, 0, -3] } : { opacity: 0.7, y: 0 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", times: [0, 0.2, 0.7, 1] }}
              >
                <path
                  d="M44 8c0-2 1-5 2-5s2 3 2 5c0 1.5-0.5 2.5-2 2.5S44 9.5 44 8z"
                  fill="url(#spoutGradient)"
                />
                <path
                  d="M41 6c0-1.5 0.5-3 1.5-3s1.5 1.5 1.5 3c0 1-0.5 1.5-1.5 1.5S41 7 41 6z"
                  fill="url(#spoutGradient)"
                  opacity="0.6"
                />
                <path
                  d="M49 7c0-1.5 0.5-3.5 1.5-3.5s1.5 2 1.5 3.5c0 1-0.5 1.5-1.5 1.5S49 8 49 7z"
                  fill="url(#spoutGradient)"
                  opacity="0.6"
                />
              </motion.g>

              {/* Main whale body - side view */}
              <motion.path
                d="M8 32
                   C8 24 14 16 28 14
                   C36 13 44 14 50 18
                   C54 20 56 24 56 30
                   C56 36 54 42 48 46
                   C42 50 32 52 24 50
                   C16 48 10 44 8 38
                   C7 36 8 34 8 32Z"
                fill="url(#whaleBodyGradient)"
              />

              {/* Whale belly (lighter area) */}
              <path
                d="M12 36
                   C14 42 20 46 28 47
                   C36 48 42 46 46 43
                   C44 46 36 49 26 48
                   C18 47 12 42 12 36Z"
                fill="url(#whaleBellyGradient)"
                opacity="0.5"
              />

              {/* Dorsal fin */}
              <motion.path
                d="M32 14
                   C34 14 38 10 40 8
                   C40 10 38 14 36 16
                   C34 18 32 18 32 16
                   L32 14Z"
                fill="url(#finGradient)"
                animate={animated ? { d: [
                  "M32 14 C34 14 38 10 40 8 C40 10 38 14 36 16 C34 18 32 18 32 16 L32 14Z",
                  "M32 14 C34 14 37 11 39 9 C39 11 37 14 35 16 C34 18 32 18 32 16 L32 14Z",
                  "M32 14 C34 14 38 10 40 8 C40 10 38 14 36 16 C34 18 32 18 32 16 L32 14Z",
                ] } : undefined}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Tail fluke */}
              <motion.path
                d="M8 32
                   C4 28 2 24 2 22
                   C4 24 6 26 8 28
                   L8 32Z
                   M8 32
                   C4 36 2 40 2 42
                   C4 40 6 38 8 36
                   L8 32Z"
                fill="url(#tailGradient)"
                animate={animated ? {
                  rotate: [-5, 5, -5],
                } : undefined}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "8px 32px" }}
              />

              {/* Pectoral fin */}
              <path
                d="M28 38
                   C30 40 34 44 36 46
                   C34 46 30 44 28 42
                   C26 40 26 38 28 38Z"
                fill="url(#finGradient)"
                opacity="0.8"
              />

              {/* Eye */}
              <motion.circle
                cx="46"
                cy="28"
                r="3"
                fill="#0a0e14"
                initial={{ scale: 1 }}
                animate={animated ? { scale: [1, 1.1, 1] } : undefined}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <circle cx="47" cy="27" r="1" fill="rgba(255,255,255,0.6)" />

              {/* Smile line */}
              <path
                d="M50 34 C52 36 52 38 50 38"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />

              <defs>
                <linearGradient id="whaleBodyGradient" x1="8" y1="14" x2="56" y2="52">
                  <stop offset="0%" stopColor="#00ff88" />
                  <stop offset="50%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#00ff88" />
                </linearGradient>
                <linearGradient id="whaleBellyGradient" x1="12" y1="36" x2="46" y2="48">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00ffcc" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="finGradient" x1="32" y1="8" x2="40" y2="18">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#00ff88" />
                </linearGradient>
                <linearGradient id="tailGradient" x1="2" y1="22" x2="8" y2="42">
                  <stop offset="0%" stopColor="#00ff88" />
                  <stop offset="100%" stopColor="#00d4ff" />
                </linearGradient>
                <linearGradient id="spoutGradient" x1="44" y1="3" x2="48" y2="10">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00ffcc" stopOpacity="0.3" />
                </linearGradient>
              </defs>
            </motion.svg>
          </div>
        </motion.div>
      </motion.div>

      {/* Text */}
      {showText && !collapsed && (
        <motion.div
          className="flex flex-col"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <span className={`font-bold ${textSize} bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient tracking-tight`}>
            WHALE SUITE
          </span>
          <span className="text-[9px] text-text-muted tracking-[0.15em] uppercase -mt-0.5">
            Privacy Protocol
          </span>
        </motion.div>
      )}
    </div>
  );
}

// Larger hero version for landing page
export function WhaleLogoHero({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Large glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-neon-green/30 to-neon-cyan/30 rounded-3xl blur-2xl" />

        {/* Container */}
        <motion.div
          className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-green via-neon-cyan to-neon-green p-[3px]"
          animate={{
            background: [
              "linear-gradient(135deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%)",
              "linear-gradient(225deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%)",
              "linear-gradient(315deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%)",
              "linear-gradient(135deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-full h-full rounded-[14px] bg-bg-primary flex items-center justify-center">
            <motion.svg
              viewBox="0 0 64 64"
              className="w-16 h-16"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Water spout */}
              <motion.g
                animate={{ opacity: [0, 1, 1, 0], y: [5, 0, 0, -3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", times: [0, 0.2, 0.7, 1] }}
              >
                <path d="M44 8c0-2 1-5 2-5s2 3 2 5c0 1.5-0.5 2.5-2 2.5S44 9.5 44 8z" fill="url(#heroSpout)" />
                <path d="M41 6c0-1.5 0.5-3 1.5-3s1.5 1.5 1.5 3c0 1-0.5 1.5-1.5 1.5S41 7 41 6z" fill="url(#heroSpout)" opacity="0.6" />
                <path d="M49 7c0-1.5 0.5-3.5 1.5-3.5s1.5 2 1.5 3.5c0 1-0.5 1.5-1.5 1.5S49 8 49 7z" fill="url(#heroSpout)" opacity="0.6" />
              </motion.g>

              {/* Whale body */}
              <path
                d="M8 32 C8 24 14 16 28 14 C36 13 44 14 50 18 C54 20 56 24 56 30 C56 36 54 42 48 46 C42 50 32 52 24 50 C16 48 10 44 8 38 C7 36 8 34 8 32Z"
                fill="url(#heroBody)"
              />
              <path d="M12 36 C14 42 20 46 28 47 C36 48 42 46 46 43 C44 46 36 49 26 48 C18 47 12 42 12 36Z" fill="url(#heroBelly)" opacity="0.5" />

              {/* Dorsal fin */}
              <motion.path
                d="M32 14 C34 14 38 10 40 8 C40 10 38 14 36 16 C34 18 32 18 32 16 L32 14Z"
                fill="url(#heroFin)"
                animate={{ d: [
                  "M32 14 C34 14 38 10 40 8 C40 10 38 14 36 16 C34 18 32 18 32 16 L32 14Z",
                  "M32 14 C34 14 37 11 39 9 C39 11 37 14 35 16 C34 18 32 18 32 16 L32 14Z",
                  "M32 14 C34 14 38 10 40 8 C40 10 38 14 36 16 C34 18 32 18 32 16 L32 14Z",
                ] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Tail */}
              <motion.path
                d="M8 32 C4 28 2 24 2 22 C4 24 6 26 8 28 L8 32Z M8 32 C4 36 2 40 2 42 C4 40 6 38 8 36 L8 32Z"
                fill="url(#heroTail)"
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "8px 32px" }}
              />

              {/* Pectoral fin */}
              <path d="M28 38 C30 40 34 44 36 46 C34 46 30 44 28 42 C26 40 26 38 28 38Z" fill="url(#heroFin)" opacity="0.8" />

              {/* Eye */}
              <motion.circle cx="46" cy="28" r="3" fill="#0a0e14" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }} />
              <circle cx="47" cy="27" r="1" fill="rgba(255,255,255,0.6)" />
              <path d="M50 34 C52 36 52 38 50 38" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

              <defs>
                <linearGradient id="heroBody" x1="8" y1="14" x2="56" y2="52">
                  <stop offset="0%" stopColor="#00ff88" />
                  <stop offset="50%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#00ff88" />
                </linearGradient>
                <linearGradient id="heroBelly" x1="12" y1="36" x2="46" y2="48">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00ffcc" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="heroFin" x1="32" y1="8" x2="40" y2="18">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#00ff88" />
                </linearGradient>
                <linearGradient id="heroTail" x1="2" y1="22" x2="8" y2="42">
                  <stop offset="0%" stopColor="#00ff88" />
                  <stop offset="100%" stopColor="#00d4ff" />
                </linearGradient>
                <linearGradient id="heroSpout" x1="44" y1="3" x2="48" y2="10">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00ffcc" stopOpacity="0.3" />
                </linearGradient>
              </defs>
            </motion.svg>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
          WHALE SUITE
        </h1>
        <p className="text-sm text-text-muted tracking-[0.2em] uppercase">
          Privacy Protocol
        </p>
      </motion.div>
    </div>
  );
}

// Compact version for collapsed sidebar
export function WhaleLogoCompact({ size = "sm" }: { size?: "xs" | "sm" | "md" }) {
  const iconSize = sizeConfig[size].icon;

  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      <div
        className="absolute bg-gradient-to-r from-neon-green/20 to-neon-cyan/20 rounded-lg blur-md"
        style={{ width: iconSize + 4, height: iconSize + 4, left: -2, top: -2 }}
      />
      <div
        className="relative rounded-lg bg-gradient-to-br from-neon-green to-neon-cyan p-[2px]"
        style={{ width: iconSize, height: iconSize }}
      >
        <div className="w-full h-full rounded-[6px] bg-bg-primary flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 64 64" style={{ width: iconSize - 8, height: iconSize - 8 }}>
            <path
              d="M8 32 C8 24 14 16 28 14 C36 13 44 14 50 18 C54 20 56 24 56 30 C56 36 54 42 48 46 C42 50 32 52 24 50 C16 48 10 44 8 38 C7 36 8 34 8 32Z"
              fill="url(#compactBody)"
            />
            <path d="M8 32 C4 28 2 24 2 22 C4 24 6 26 8 28 L8 32Z M8 32 C4 36 2 40 2 42 C4 40 6 38 8 36 L8 32Z" fill="url(#compactTail)" />
            <circle cx="46" cy="28" r="2.5" fill="#0a0e14" />
            <defs>
              <linearGradient id="compactBody" x1="8" y1="14" x2="56" y2="52">
                <stop offset="0%" stopColor="#00ff88" />
                <stop offset="100%" stopColor="#00d4ff" />
              </linearGradient>
              <linearGradient id="compactTail" x1="2" y1="22" x2="8" y2="42">
                <stop offset="0%" stopColor="#00ff88" />
                <stop offset="100%" stopColor="#00d4ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
