'use client';

import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import { Wifi, WifiOff, ChevronDown, Check, Zap } from 'lucide-react';
import type { RPCProvider } from '@/hooks/usePortfolio';

interface RPCProviderSelectorProps {
  provider: RPCProvider;
  onProviderChange: (provider: RPCProvider) => void;
  ping: number | null;
  className?: string;
}

const PROVIDERS: { id: RPCProvider; name: string; color: string; logo: string }[] = [
  {
    id: 'helius',
    name: 'Helius',
    color: '#FF6B35',
    logo: '/rpc/helius.svg',
  },
  {
    id: 'quicknode',
    name: 'QuickNode',
    color: '#0052FF',
    logo: '/rpc/quicknode.svg',
  },
];

export default function RPCProviderSelector({
  provider,
  onProviderChange,
  ping,
  className = '',
}: RPCProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeProvider = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0];

  const getPingColor = (ping: number | null) => {
    if (ping === null) return 'text-text-muted';
    if (ping < 0) return 'text-red-400';
    if (ping < 100) return 'text-neon-green';
    if (ping < 300) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getPingLabel = (ping: number | null) => {
    if (ping === null) return 'Testing...';
    if (ping < 0) return 'Offline';
    return `${ping}ms`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-tertiary border border-border-primary hover:border-neon-green/30 transition-all"
      >
        {/* Provider Logo */}
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-xs"
          style={{ backgroundColor: activeProvider.color }}
        >
          {activeProvider.name.charAt(0)}
        </div>

        {/* Provider Name */}
        <span className="text-sm font-medium text-text-primary hidden sm:inline">
          {activeProvider.name}
        </span>

        {/* Ping Status */}
        <div className="flex items-center gap-1.5">
          {ping !== null && ping >= 0 ? (
            <Wifi className={`w-3.5 h-3.5 ${getPingColor(ping)}`} />
          ) : ping !== null ? (
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-text-muted border-t-transparent animate-spin" />
          )}
          <span className={`text-xs font-mono ${getPingColor(ping)}`}>
            {getPingLabel(ping)}
          </span>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-bg-secondary border border-border-primary shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border-primary bg-bg-tertiary">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Zap className="w-4 h-4 text-neon-green" />
                <span>RPC Provider</span>
                <Badge variant="success" size="xs">Sponsored</Badge>
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                Premium infrastructure for real-time data
              </p>
            </div>

            {/* Providers */}
            <div className="p-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onProviderChange(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    provider === p.id
                      ? 'bg-neon-green/10 border border-neon-green/30'
                      : 'hover:bg-bg-elevated'
                  }`}
                >
                  {/* Logo */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{p.name}</span>
                      {provider === p.id && (
                        <Check className="w-4 h-4 text-neon-green" />
                      )}
                    </div>
                    <p className="text-[10px] text-text-muted">
                      {p.id === 'helius' ? 'DAS API + Enhanced Transactions' : 'Standard Solana RPC'}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border-primary bg-bg-tertiary">
              <p className="text-[10px] text-text-muted text-center">
                Powered by{' '}
                <a href="https://helius.dev" target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] hover:underline">
                  Helius
                </a>
                {' & '}
                <a href="https://quicknode.com" target="_blank" rel="noopener noreferrer" className="text-[#0052FF] hover:underline">
                  QuickNode
                </a>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
