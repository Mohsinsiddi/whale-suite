'use client';

import { useMemo } from 'react';

interface AnonAvatarProps {
  anonId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

// Whale-themed color palettes
const PALETTES = [
  ['#00ff88', '#00d4ff'], // Neon green-cyan
  ['#ff6b6b', '#feca57'], // Coral-gold
  ['#5f27cd', '#00d2d3'], // Purple-teal
  ['#ff9ff3', '#54a0ff'], // Pink-blue
  ['#1dd1a1', '#10ac84'], // Mint-emerald
  ['#ee5a24', '#f9ca24'], // Orange-yellow
  ['#6c5ce7', '#a29bfe'], // Violet-lavender
  ['#00cec9', '#81ecec'], // Cyan-light cyan
  ['#fd79a8', '#e84393'], // Pink-magenta
  ['#00b894', '#55efc4'], // Green-mint
];

// Whale patterns (simple SVG paths)
const WHALE_PATTERNS = [
  // Classic whale
  'M12 8c-2 0-4 1-5 3-1 2-1 4 0 5 1 2 3 3 5 3s4-1 5-3c1-2 1-4 0-5s-3-3-5-3zm-2 4c0-.5.5-1 1-1s1 .5 1 1-.5 1-1 1-1-.5-1-1z',
  // Rounded whale
  'M6 12c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6zm4-1c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1z',
  // Geometric whale
  'M4 12l4-4h8l4 4-4 4H8l-4-4zm6-1a1 1 0 100 2 1 1 0 000-2z',
  // Cute whale
  'M12 6c-3.3 0-6 2.2-6 5s2.7 5 6 5 6-2.2 6-5-2.7-5-6-5zm-2 3.5c0-.3.2-.5.5-.5s.5.2.5.5-.2.5-.5.5-.5-.2-.5-.5zm4 3c-1.1.6-2.9.6-4 0 .2-.4.6-.5 1-.3.5.3 1.5.3 2 0 .4-.2.8-.1 1 .3z',
];

// Generate consistent hash from string
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Size configurations
const SIZES = {
  xs: { container: 24, text: 8, icon: 12 },
  sm: { container: 32, text: 10, icon: 16 },
  md: { container: 40, text: 12, icon: 20 },
  lg: { container: 56, text: 16, icon: 28 },
  xl: { container: 80, text: 24, icon: 40 },
};

export function AnonAvatar({ anonId, size = 'md', className = '', showBadge = false }: AnonAvatarProps) {
  const { palette, pattern, initials, rotation } = useMemo(() => {
    // Safeguard against undefined/empty anonId
    const safeId = anonId || 'Whale#0000';
    const hash = hashCode(safeId);
    const paletteIndex = hash % PALETTES.length;
    const patternIndex = (hash >> 4) % WHALE_PATTERNS.length;
    const rotation = ((hash >> 8) % 4) * 90;

    // Extract initials from anonId (e.g., "Whale#A4F2" -> "A4")
    const match = safeId.match(/#([A-Z0-9]{2})/i);
    const initials = match ? match[1] : safeId.slice(-2).toUpperCase();

    return {
      palette: PALETTES[paletteIndex],
      pattern: WHALE_PATTERNS[patternIndex],
      initials,
      rotation,
    };
  }, [anonId]);

  const sizeConfig = SIZES[size];
  const [color1, color2] = palette;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden ${className}`}
      style={{
        width: sizeConfig.container,
        height: sizeConfig.container,
        background: `linear-gradient(${135 + rotation}deg, ${color1}20, ${color2}30)`,
        border: `2px solid ${color1}50`,
      }}
    >
      {/* Background pattern */}
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 opacity-30"
        style={{
          width: '100%',
          height: '100%',
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <defs>
          <linearGradient id={`grad-${anonId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>
        <path d={pattern} fill={`url(#grad-${anonId})`} />
      </svg>

      {/* Whale icon or initials */}
      <div
        className="relative z-10 font-bold"
        style={{
          fontSize: sizeConfig.text,
          color: color1,
          textShadow: `0 0 10px ${color1}50`,
        }}
      >
        {size === 'xs' ? (
          // Just show whale emoji for tiny size
          <span style={{ fontSize: sizeConfig.icon * 0.6 }}>🐋</span>
        ) : (
          initials
        )}
      </div>

      {/* Online/active badge */}
      {showBadge && (
        <div
          className="absolute bottom-0 right-0 rounded-full border-2 border-bg-primary"
          style={{
            width: sizeConfig.container * 0.3,
            height: sizeConfig.container * 0.3,
            backgroundColor: '#00ff88',
          }}
        />
      )}
    </div>
  );
}

// Larger profile card version
export function AnonProfileCard({
  anonId,
  joinedAt,
  messageCount,
  isOnline = false,
}: {
  anonId: string;
  joinedAt?: string;
  messageCount?: number;
  isOnline?: boolean;
}) {
  const hash = hashCode(anonId);
  const palette = PALETTES[hash % PALETTES.length];
  const [color1, color2] = palette;

  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        background: `linear-gradient(135deg, ${color1}10, ${color2}15)`,
        borderColor: `${color1}30`,
      }}
    >
      <div className="flex items-center gap-3">
        <AnonAvatar anonId={anonId} size="lg" showBadge={isOnline} />
        <div>
          <p className="font-bold text-text-primary">{anonId}</p>
          {joinedAt && (
            <p className="text-xs text-text-muted">
              Joined {new Date(joinedAt).toLocaleDateString()}
            </p>
          )}
          {messageCount !== undefined && (
            <p className="text-xs text-text-muted">
              {messageCount} messages
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnonAvatar;
