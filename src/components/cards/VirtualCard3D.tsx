'use client';

/**
 * 3D Virtual Card Component
 * Professional, sleek design with proper card network logos
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff } from 'lucide-react';

export type CardType = 'visa' | 'mastercard';
export type CardStatus = 'pending' | 'awaiting_payment' | 'processing' | 'issued' | 'completed' | 'failed' | 'expired';

export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export interface VirtualCard3DProps {
  cardType: CardType;
  amount: number;
  email: string;
  cardholderName?: string;
  paymentAddress?: string;
  status?: CardStatus;
  cardDetails?: CardDetails;
  isFlipped?: boolean;
  onFlip?: () => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showFlipHint?: boolean;
  className?: string;
}

// Visa Logo SVG
function VisaLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1000 324" fill="currentColor">
      <path d="M651.19 0.5c-70.93 0-134.32 36.76-134.32 104.69 0 77.9 112.42 83.28 112.42 122.42 0 16.48-18.88 31.23-51.14 31.23-45.77 0-79.98-20.61-79.98-20.61l-14.64 68.55s39.41 17.41 91.73 17.41c77.55 0 138.58-38.57 138.58-107.66 0-82.32-113.04-87.6-113.04-123.9 0-12.91 15.5-27.03 47.66-27.03 36.29 0 65.89 14.99 65.89 14.99l14.33-66.2S696.99 0.5 651.19 0.5zM2.22 5.49L0 17.54s29.51 5.36 56.13 15.93c34.23 12.39 36.68 19.57 42.44 42.13l62.87 238.58h84.94L374.82 5.49h-84.71l-84.38 219.04-34.23-185.71c-3.21-20.5-19.45-33.33-38.08-33.33H2.22zM410.24 5.49l-66.63 308.69h80.83l66.39-308.69h-80.59zM905.16 5.49c-18.63 0-28.48 10.01-35.67 27.51l-118.34 281.18h84.71l16.42-46.06h103.38l9.88 46.06H1000L970.19 5.49h-65.03zm11.07 83.23l24.7 117.13h-67.01l42.31-117.13z"/>
    </svg>
  );
}

// Mastercard Logo SVG
function MastercardLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 152 108" fill="none">
      <circle cx="98" cy="54" r="54" fill="#F79E1B"/>
      <circle cx="54" cy="54" r="54" fill="#EB001B"/>
      <path d="M76 17.88c12.4 9.96 20.36 25.18 20.36 42.12S88.4 89.16 76 99.12c-12.4-9.96-20.36-25.18-20.36-42.12S63.6 27.84 76 17.88z" fill="#FF5F00"/>
    </svg>
  );
}

// NFC/Contactless Icon
function ContactlessIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8.5 14.5A5 5 0 0 1 8.5 9.5" strokeLinecap="round"/>
      <path d="M5 17a9 9 0 0 1 0-10" strokeLinecap="round"/>
      <path d="M12 12a2 2 0 0 1 0 0" strokeLinecap="round"/>
    </svg>
  );
}

export default function VirtualCard3D({
  cardType,
  amount,
  email,
  cardholderName,
  paymentAddress,
  status,
  cardDetails,
  isFlipped: controlledFlipped,
  onFlip: controlledOnFlip,
  size = 'md',
  interactive = true,
  showFlipHint = false,
  className = '',
}: VirtualCard3DProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const [showCVV, setShowCVV] = useState(false);

  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
  const handleFlip = () => {
    if (!interactive) return;
    if (controlledOnFlip) {
      controlledOnFlip();
    } else {
      setInternalFlipped(!internalFlipped);
    }
  };

  // Card styling based on type
  const cardStyle = cardType === 'visa'
    ? {
        gradient: 'from-[#1a1f71] via-[#1a237e] to-[#0d47a1]',
        accent: '#1a1f71',
      }
    : {
        gradient: 'from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]',
        accent: '#eb001b',
      };

  // Size configuration - compact and professional
  const sizes = {
    sm: { width: 'w-[260px]', padding: 'p-4', chip: 'w-8 h-6', logo: 'h-6', text: 'text-[10px]', number: 'text-sm', amount: 'text-lg' },
    md: { width: 'w-[320px]', padding: 'p-5', chip: 'w-10 h-7', logo: 'h-7', text: 'text-[11px]', number: 'text-base', amount: 'text-xl' },
    lg: { width: 'w-[380px]', padding: 'p-6', chip: 'w-12 h-8', logo: 'h-8', text: 'text-xs', number: 'text-lg', amount: 'text-2xl' },
  };

  const s = sizes[size];

  return (
    <div className={`${s.width} mx-auto ${className}`} style={{ perspective: '1000px' }}>
      <motion.div
        className={`relative w-full aspect-[1.586/1] ${interactive ? 'cursor-pointer' : ''}`}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        onClick={handleFlip}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className={`relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-br ${cardStyle.gradient} shadow-xl`}>
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />

            {/* Diagonal wrapped address watermark */}
            {paymentAddress && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Multiple diagonal lines wrapping around the card */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute whitespace-nowrap font-mono text-white select-none"
                    style={{
                      fontSize: '6px',
                      letterSpacing: '0.5px',
                      transform: 'rotate(-30deg)',
                      top: `${-20 + i * 28}%`,
                      left: '-50%',
                      width: '200%',
                      opacity: i % 2 === 0 ? 0.06 : 0.03,
                    }}
                  >
                    {Array(3).fill(`${paymentAddress} • `).join('')}
                  </div>
                ))}
              </div>
            )}

            {/* Card content */}
            <div className={`relative h-full ${s.padding} flex flex-col justify-between`}>
              {/* Top: Chip + Contactless + Logo */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {/* EMV Chip */}
                  <div className={`${s.chip} rounded-[4px] bg-gradient-to-br from-[#d4af37] via-[#f4e4a6] to-[#d4af37] shadow-sm`}>
                    <div className="w-full h-full grid grid-cols-3 gap-[1px] p-[3px]">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-[#c9a227] rounded-[1px]" />
                      ))}
                    </div>
                  </div>
                  {/* Contactless */}
                  <ContactlessIcon className="w-5 h-5 text-white/60" />
                </div>

                {/* Card Network Logo */}
                <div className="flex flex-col items-end">
                  {cardType === 'visa' ? (
                    <VisaLogo className={`${s.logo} text-white`} />
                  ) : (
                    <MastercardLogo className={s.logo} />
                  )}
                </div>
              </div>

              {/* Middle: Card Number */}
              <div className="space-y-1">
                <div className={`font-mono ${s.number} text-white/90 tracking-[0.15em]`}>
                  {cardDetails
                    ? cardDetails.cardNumber.replace(/(.{4})/g, '$1 ').trim()
                    : '•••• •••• •••• ••••'
                  }
                </div>
              </div>

              {/* Bottom: Holder + Expiry + Amount */}
              <div className="flex items-end justify-between">
                <div className="space-y-0.5">
                  <div className={`${s.text} text-white/50 uppercase tracking-wider`}>Card Holder</div>
                  <div className={`${s.text} text-white font-medium tracking-wide truncate max-w-[120px]`}>
                    {cardDetails?.cardholderName || cardholderName || email.split('@')[0].toUpperCase()}
                  </div>
                </div>

                <div className="text-center">
                  <div className={`${s.text} text-white/50 uppercase tracking-wider`}>Valid Thru</div>
                  <div className={`${s.text} text-white font-medium`}>
                    {cardDetails?.expiryDate || '••/••'}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`${s.text} text-white/50 uppercase tracking-wider`}>Balance</div>
                  <div className={`${s.amount} text-white font-semibold`}>
                    ${amount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              {status && status !== 'issued' && (
                <div className="absolute top-3 right-3">
                  <span className={`
                    px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide
                    ${status === 'failed' || status === 'expired'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-amber-500/20 text-amber-300'
                    }
                  `}>
                    {status.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-[#1f1f1f] to-[#0a0a0a] shadow-xl">
            {/* Magnetic stripe */}
            <div className="absolute top-6 left-0 right-0 h-10 bg-[#1a1a1a]" />

            {/* Signature strip + CVV */}
            <div className={`absolute top-20 left-0 right-0 ${s.padding} flex items-center gap-3`}>
              <div className="flex-1 h-8 bg-[#f5f5f5] rounded-sm flex items-center px-3">
                <span className="text-gray-400 text-xs italic">Authorized Signature</span>
              </div>
              <div className="w-12 h-8 bg-white rounded-sm flex items-center justify-center">
                {cardDetails ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowCVV(!showCVV); }}
                    className="flex items-center gap-0.5 text-gray-800 font-mono text-sm"
                  >
                    {showCVV ? cardDetails.cvv : '•••'}
                    {showCVV ? <EyeOff className="w-2.5 h-2.5 ml-0.5" /> : <Eye className="w-2.5 h-2.5 ml-0.5" />}
                  </button>
                ) : (
                  <span className="text-gray-400 font-mono text-xs">CVV</span>
                )}
              </div>
            </div>

            {/* Bottom info */}
            <div className={`absolute bottom-0 left-0 right-0 ${s.padding} space-y-2`}>
              <p className="text-[8px] text-gray-500 leading-relaxed">
                This card is property of the issuer. Use subject to cardholder agreement.
                For support: support@starpay.cards
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-gray-800">
                <span className="text-[9px] text-gray-500">Zero-Knowledge Technology</span>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  <span className="text-[9px] text-emerald-500 font-medium">SECURE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Flip hint */}
      {interactive && showFlipHint && (
        <p className="text-center mt-2 text-[10px] text-gray-500">Click to flip</p>
      )}
    </div>
  );
}
