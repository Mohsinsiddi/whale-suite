'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Heart, Copy, Check, Wallet, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Donation addresses
const DONATION_ADDRESSES = {
  SOL: {
    address: '3jnUmfGewsmm9V8p8iVU3wS2TtPoX3oAUjemWLiBmp4G',
    name: 'Solana',
    icon: '/icons/solana.svg',
    color: 'from-[#9945FF] to-[#14F195]',
    explorer: 'https://solscan.io/account/',
  },
  ETH: {
    address: '0x1E677331F7F33E9cb645Ab7c528B688048C0E86D',
    name: 'Ethereum',
    icon: '/icons/ethereum.svg',
    color: 'from-[#627EEA] to-[#8A9CFF]',
    explorer: 'https://etherscan.io/address/',
  },
};

function DonationCard({
  chain,
  address,
  name,
  color,
  explorer
}: {
  chain: string;
  address: string;
  name: string;
  color: string;
  explorer: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const truncated = `${address.slice(0, 10)}...${address.slice(-8)}`;

  return (
    <Card className="p-6 hover:border-neon-green/30 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <span className="text-white font-bold text-lg">{chain}</span>
        </div>
        <div>
          <h3 className="font-bold text-text-primary">{name}</h3>
          <p className="text-text-muted text-sm">Send {chain} to support</p>
        </div>
      </div>

      {/* QR Code Toggle */}
      {showQR && (
        <div className="mb-4 flex justify-center p-4 bg-white rounded-xl">
          <QRCodeSVG
            value={address}
            size={180}
            level="H"
            includeMargin={false}
          />
        </div>
      )}

      {/* Address */}
      <div className="p-3 rounded-lg bg-bg-tertiary/50 border border-border-primary mb-4">
        <p className="text-xs text-text-muted mb-1">Wallet Address</p>
        <p className="font-mono text-sm text-text-primary break-all">{truncated}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Address
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowQR(!showQR)}
        >
          {showQR ? 'Hide QR' : 'Show QR'}
        </Button>
      </div>

      {/* Explorer Link */}
      <a
        href={`${explorer}${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 mt-3 text-xs text-text-muted hover:text-neon-cyan transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        View on Explorer
      </a>
    </Card>
  );
}

export default function DonatePage() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-error/20 to-pink-500/20 mb-4">
          <Heart className="w-8 h-8 text-error" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
          Support Whale Suite
        </h1>
        <p className="text-text-secondary max-w-lg mx-auto">
          Whale Suite is an open-source project built for the Solana Privacy Hack 2026.
          Your donations help us continue development and keep the platform running.
        </p>
      </div>

      {/* Why Donate */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-neon-green/5 to-neon-cyan/5 border-neon-green/20">
        <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-neon-green" />
          Why Donate?
        </h2>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-neon-green mt-1">•</span>
            <span>Keep the platform free and accessible for everyone</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neon-green mt-1">•</span>
            <span>Fund ongoing development of new privacy features</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neon-green mt-1">•</span>
            <span>Cover infrastructure costs (RPC, hosting, APIs)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neon-green mt-1">•</span>
            <span>Support the open-source privacy ecosystem on Solana</span>
          </li>
        </ul>
      </Card>

      {/* Donation Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <DonationCard
          chain="SOL"
          address={DONATION_ADDRESSES.SOL.address}
          name={DONATION_ADDRESSES.SOL.name}
          color={DONATION_ADDRESSES.SOL.color}
          explorer={DONATION_ADDRESSES.SOL.explorer}
        />
        <DonationCard
          chain="ETH"
          address={DONATION_ADDRESSES.ETH.address}
          name={DONATION_ADDRESSES.ETH.name}
          color={DONATION_ADDRESSES.ETH.color}
          explorer={DONATION_ADDRESSES.ETH.explorer}
        />
      </div>

      {/* Thank You Note */}
      <div className="text-center">
        <p className="text-text-muted text-sm">
          Thank you for supporting privacy on Solana! Every contribution, big or small, makes a difference.
        </p>
        <p className="text-text-muted/60 text-xs mt-2">
          Built with love for the Solana Privacy Hack 2026
        </p>
      </div>
    </div>
  );
}
