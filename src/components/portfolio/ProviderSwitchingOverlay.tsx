'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { RPCProvider } from '@/hooks/usePortfolio';

interface ProviderSwitchingOverlayProps {
  isVisible: boolean;
  provider: RPCProvider;
}

const PROVIDER_INFO = {
  helius: {
    name: 'Helius',
    color: '#FF6B35',
    description: 'DAS API + Enhanced Transactions',
  },
  quicknode: {
    name: 'QuickNode',
    color: '#0052FF',
    description: 'Standard Solana RPC',
  },
};

export default function ProviderSwitchingOverlay({
  isVisible,
  provider,
}: ProviderSwitchingOverlayProps) {
  const info = PROVIDER_INFO[provider];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-bg-secondary border border-border-primary shadow-2xl"
          >
            {/* Provider Icon */}
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 0 0 ${info.color}00`,
                  `0 0 0 20px ${info.color}40`,
                  `0 0 0 0 ${info.color}00`,
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold"
              style={{ backgroundColor: info.color }}
            >
              {info.name.charAt(0)}
            </motion.div>

            {/* Text */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                Switching to {info.name}
              </h3>
              <p className="text-sm text-text-secondary">
                {info.description}
              </p>
            </div>

            {/* Loading Animation */}
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-t-transparent rounded-full"
                style={{ borderColor: `${info.color}40`, borderTopColor: 'transparent' }}
              />
              <span className="text-sm text-text-muted">
                Fetching portfolio data...
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-64 h-1 rounded-full bg-bg-tertiary overflow-hidden">
              <motion.div
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="w-1/3 h-full rounded-full"
                style={{ backgroundColor: info.color }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
