'use client';

import { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Toggle from '@/components/ui/Toggle';
import { useRPC } from '@/store';
import { useNetwork } from '@/hooks/useNetwork';
import type { RPCEndpoint, RPCProvider } from '@/store';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Zap,
  Clock,
  Globe,
  Key,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Shield,
} from 'lucide-react';

// Provider info with logos and links
const PROVIDER_INFO: Record<RPCProvider, { name: string; website: string; color: string; description: string }> = {
  helius: {
    name: 'Helius',
    website: 'https://helius.dev',
    color: '#FF6B35',
    description: 'Enterprise-grade Solana infrastructure with enhanced APIs',
  },
  quicknode: {
    name: 'QuickNode',
    website: 'https://quicknode.com',
    color: '#0052FF',
    description: 'Fast, reliable blockchain infrastructure',
  },
  public: {
    name: 'Solana Public',
    website: 'https://solana.com',
    color: '#9945FF',
    description: 'Free public Solana RPC (rate limited)',
  },
  custom: {
    name: 'Custom',
    website: '',
    color: '#6B7280',
    description: 'Your own RPC endpoint',
  },
};

// Ping status colors
const getPingColor = (ping?: number, isHealthy?: boolean): string => {
  if (isHealthy === false) return 'text-red-400';
  if (!ping) return 'text-text-muted';
  if (ping < 100) return 'text-neon-green';
  if (ping < 300) return 'text-yellow-400';
  if (ping < 500) return 'text-orange-400';
  return 'text-red-400';
};

const getPingLabel = (ping?: number, isHealthy?: boolean): string => {
  if (isHealthy === false) return 'Offline';
  if (!ping) return 'Not tested';
  if (ping < 100) return 'Excellent';
  if (ping < 300) return 'Good';
  if (ping < 500) return 'Fair';
  return 'Slow';
};

interface EndpointCardProps {
  endpoint: RPCEndpoint;
  isActive: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}

// Get masked URL for display
const getMaskedUrl = (endpoint: RPCEndpoint): string => {
  if (endpoint.isCustom) {
    // Show first part of custom URL
    try {
      const url = new URL(endpoint.url);
      return `${url.hostname}`;
    } catch {
      return 'Custom Endpoint';
    }
  }
  // For built-in providers, just show provider info
  return PROVIDER_INFO[endpoint.provider].description;
};

function EndpointCard({ endpoint, isActive, onSelect, onRemove }: EndpointCardProps) {
  const providerInfo = PROVIDER_INFO[endpoint.provider];
  const pingColor = getPingColor(endpoint.ping, endpoint.isHealthy);
  const pingLabel = getPingLabel(endpoint.ping, endpoint.isHealthy);

  return (
    <div
      className={`relative p-3 sm:p-4 rounded-xl border transition-all cursor-pointer group ${
        isActive
          ? 'bg-neon-green/10 border-neon-green/50 shadow-lg shadow-neon-green/10'
          : 'bg-bg-tertiary border-border-primary hover:border-neon-green/30'
      }`}
      onClick={onSelect}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 rounded-full bg-neon-green flex items-center justify-center">
            <Check className="w-4 h-4 text-bg-primary" />
          </div>
        </div>
      )}

      {/* Provider info */}
      <div className="flex items-start gap-3">
        {/* Logo placeholder */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: providerInfo.color }}
        >
          {providerInfo.name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-text-primary">{providerInfo.name}</span>
            {endpoint.isCustom ? (
              <Badge size="xs" variant="default">Custom</Badge>
            ) : (
              <Badge size="xs" variant="success">Sponsored</Badge>
            )}
          </div>

          {/* Description instead of URL */}
          <p className="text-xs text-text-muted mb-2">
            {getMaskedUrl(endpoint)}
          </p>

          {/* Ping info */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              {endpoint.isHealthy === false ? (
                <WifiOff className={`w-3.5 h-3.5 ${pingColor}`} />
              ) : (
                <Wifi className={`w-3.5 h-3.5 ${pingColor}`} />
              )}
              <span className={pingColor}>
                {endpoint.ping !== undefined ? `${endpoint.ping}ms` : '---'}
              </span>
            </div>
            <span className={`${pingColor}`}>{pingLabel}</span>
            {endpoint.lastChecked && (
              <span className="text-text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.round((Date.now() - endpoint.lastChecked) / 1000)}s ago
              </span>
            )}
          </div>
        </div>

        {/* Remove button for custom endpoints */}
        {endpoint.isCustom && onRemove && (
          <button
            className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function RPCSettings() {
  const { network } = useNetwork();
  const {
    endpoints,
    customEndpoints,
    activeEndpointId,
    selectionStrategy,
    apiKeys,
    isTestingPings,
    lastPingTest,
    setActiveEndpoint,
    setSelectionStrategy,
    setApiKey,
    addCustomEndpoint,
    removeCustomEndpoint,
    testAllPings,
  } = useRPC();

  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');

  // Get endpoints for current network
  const networkEndpoints = [...endpoints, ...customEndpoints].filter(
    (e) => e.network === network
  );

  // Sort by ping (best first)
  const sortedEndpoints = [...networkEndpoints].sort((a, b) => {
    if (a.isHealthy === false) return 1;
    if (b.isHealthy === false) return -1;
    return (a.ping || 9999) - (b.ping || 9999);
  });

  // Best endpoint
  const bestEndpoint = sortedEndpoints.find((e) => e.isHealthy !== false);

  // Auto-select best endpoint when strategy is 'auto'
  useEffect(() => {
    if (selectionStrategy === 'auto' && bestEndpoint && lastPingTest) {
      setActiveEndpoint(bestEndpoint.id);
    }
  }, [selectionStrategy, bestEndpoint, lastPingTest, setActiveEndpoint]);

  // Test pings on mount
  useEffect(() => {
    if (!lastPingTest) {
      testAllPings();
    }
  }, [lastPingTest, testAllPings]);

  // Handle adding custom endpoint
  const handleAddCustom = useCallback(() => {
    if (!customUrl.trim()) return;

    addCustomEndpoint({
      provider: 'custom',
      name: customName.trim() || 'Custom RPC',
      url: customUrl.trim(),
      network,
    });

    setCustomUrl('');
    setCustomName('');
    setShowAddCustom(false);

    // Test the new endpoint
    setTimeout(() => testAllPings(), 100);
  }, [customUrl, customName, network, addCustomEndpoint, testAllPings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-neon-green" />
            RPC Configuration
          </CardTitle>
          <Badge variant={network === 'mainnet' ? 'success' : 'warning'} size="sm">
            {network}
          </Badge>
        </CardHeader>

        <p className="text-sm text-text-muted mb-4">
          Premium RPC infrastructure powered by industry-leading providers. Auto-selects the fastest connection for you.
        </p>

        {/* Selection strategy */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-bg-tertiary mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-neon-green" />
            <div>
              <p className="font-medium text-text-primary text-sm">Auto-select best RPC</p>
              <p className="text-xs text-text-muted">Automatically use the fastest endpoint</p>
            </div>
          </div>
          <Toggle
            checked={selectionStrategy === 'auto'}
            onChange={(checked) => setSelectionStrategy(checked ? 'auto' : 'manual')}
          />
        </div>

        {/* Test all button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => testAllPings()}
          disabled={isTestingPings}
          fullWidth
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isTestingPings ? 'animate-spin' : ''}`} />
          {isTestingPings ? 'Testing connections...' : 'Test All Connections'}
        </Button>
      </Card>

      {/* Current Best */}
      {bestEndpoint && (
        <Card variant="glow" padding="sm" className="border-neon-green/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neon-green/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-neon-green" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted">Best Connection</p>
              <p className="font-medium text-text-primary">
                {PROVIDER_INFO[bestEndpoint.provider].name}
                <span className="text-neon-green ml-2">{bestEndpoint.ping}ms</span>
              </p>
            </div>
            {selectionStrategy === 'auto' && (
              <Badge variant="success" size="xs">Auto-selected</Badge>
            )}
          </div>
        </Card>
      )}

      {/* Endpoints List */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle className="text-sm">Available Endpoints ({network})</CardTitle>
          <Button variant="ghost" size="xs" onClick={() => setShowAddCustom(!showAddCustom)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Custom
          </Button>
        </CardHeader>

        {/* Add Custom Form */}
        {showAddCustom && (
          <div className="mb-4 p-4 rounded-xl bg-bg-tertiary border border-border-primary space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Name (optional)</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="My Custom RPC"
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-primary text-text-primary placeholder:text-text-muted text-sm focus:border-neon-green focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">RPC URL *</label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://your-rpc-endpoint.com"
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-primary text-text-primary placeholder:text-text-muted text-sm focus:border-neon-green focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleAddCustom} disabled={!customUrl.trim()}>
                Add Endpoint
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAddCustom(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Endpoints grid */}
        <div className="space-y-3">
          {sortedEndpoints.map((endpoint) => (
            <EndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              isActive={endpoint.id === activeEndpointId}
              onSelect={() => {
                setActiveEndpoint(endpoint.id);
                if (selectionStrategy === 'auto') {
                  setSelectionStrategy('manual');
                }
              }}
              onRemove={endpoint.isCustom ? () => removeCustomEndpoint(endpoint.id) : undefined}
            />
          ))}
        </div>

        {/* No endpoints */}
        {sortedEndpoints.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No endpoints configured for {network}</p>
          </div>
        )}
      </Card>

      {/* API Keys Section */}
      <Card variant="default" padding="md">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setShowApiKeys(!showApiKeys)}
        >
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-neon-cyan" />
            <CardTitle className="text-sm">API Keys (Optional)</CardTitle>
          </div>
          {showApiKeys ? (
            <ChevronUp className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          )}
        </button>

        {showApiKeys && (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-text-muted">
              Add your own API keys for higher rate limits. Keys are stored locally and never sent to our servers.
            </p>

            {/* Helius */}
            <div>
              <label className="flex items-center gap-2 text-sm text-text-primary mb-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PROVIDER_INFO.helius.color }} />
                Helius API Key
                <a href="https://helius.dev" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <input
                type="password"
                value={apiKeys.helius || ''}
                onChange={(e) => setApiKey('helius', e.target.value)}
                placeholder="Enter your Helius API key"
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-text-primary placeholder:text-text-muted text-sm focus:border-neon-green focus:outline-none"
              />
            </div>

            {/* QuickNode */}
            <div>
              <label className="flex items-center gap-2 text-sm text-text-primary mb-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PROVIDER_INFO.quicknode.color }} />
                QuickNode Endpoint (Optional)
                <a href="https://quicknode.com" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <input
                type="text"
                value={apiKeys.quicknode || ''}
                onChange={(e) => setApiKey('quicknode', e.target.value)}
                placeholder="Your custom QuickNode endpoint URL"
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-text-primary placeholder:text-text-muted text-sm focus:border-neon-green focus:outline-none"
              />
              <p className="text-xs text-text-muted mt-1">
                A default QuickNode endpoint is already configured. Add your own for higher limits.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-neon-green/5 border border-neon-green/20">
              <p className="text-xs text-text-secondary flex items-start gap-2">
                <Shield className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-neon-green">Security:</strong> API keys are stored in your browser&apos;s local storage and are never transmitted to our servers.
                </span>
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Sponsor Credits */}
      <Card variant="default" padding="sm">
        <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <span>RPC infrastructure powered by</span>
          <a href="https://helius.dev" target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] hover:underline font-medium">
            Helius
          </a>
          <span>•</span>
          <a href="https://quicknode.com" target="_blank" rel="noopener noreferrer" className="text-[#0052FF] hover:underline font-medium">
            QuickNode
          </a>
          <span>•</span>
          <a href="https://solana.com" target="_blank" rel="noopener noreferrer" className="text-[#9945FF] hover:underline font-medium">
            Solana
          </a>
        </div>
      </Card>
    </div>
  );
}
