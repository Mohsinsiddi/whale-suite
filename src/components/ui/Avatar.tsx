"use client";

import { ReactNode } from "react";
import Image from "next/image";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string | ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy" | "away";
  className?: string;
}

export default function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  status,
  className = "",
}: AvatarProps) {
  const sizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const statusSizes = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  const statusColors = {
    online: "bg-success",
    offline: "bg-text-muted",
    busy: "bg-error",
    away: "bg-warning",
  };

  const getFallbackContent = () => {
    if (typeof fallback === "string") {
      return fallback.slice(0, 2).toUpperCase();
    }
    return fallback || "?";
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`
          ${sizes[size]}
          rounded-full overflow-hidden
          bg-gradient-to-br from-neon-green to-neon-cyan
          flex items-center justify-center
          font-bold text-bg-primary
          ring-2 ring-bg-primary
        `}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
          />
        ) : (
          <span>{getFallbackContent()}</span>
        )}
      </div>

      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            ${statusSizes[size]}
            ${statusColors[status]}
            rounded-full
            ring-2 ring-bg-primary
          `}
        />
      )}
    </div>
  );
}

// Avatar Group
interface AvatarGroupProps {
  children: ReactNode;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
}

export function AvatarGroup({ children, max = 4, size = "md" }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleAvatars = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  const overlapSizes = {
    xs: "-ml-2",
    sm: "-ml-2.5",
    md: "-ml-3",
    lg: "-ml-4",
  };

  const counterSizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  return (
    <div className="flex items-center">
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={`${index > 0 ? overlapSizes[size] : ""}`}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          {avatar}
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={`
            ${overlapSizes[size]}
            ${counterSizes[size]}
            rounded-full
            bg-bg-tertiary border border-border-primary
            flex items-center justify-center
            font-medium text-text-secondary
          `}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// Wallet Avatar (with truncated address)
interface WalletAvatarProps {
  address: string;
  size?: "sm" | "md" | "lg";
  showAddress?: boolean;
  onClick?: () => void;
}

export function WalletAvatar({ address, size = "md", showAddress = true, onClick }: WalletAvatarProps) {
  const truncated = `${address.slice(0, 4)}...${address.slice(-4)}`;

  // Generate a consistent color based on address
  const hash = address.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const hue = Math.abs(hash) % 360;

  return (
    <div
      className={`flex items-center gap-2 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div
        className={`
          ${size === "sm" ? "w-6 h-6" : size === "lg" ? "w-10 h-10" : "w-8 h-8"}
          rounded-full flex items-center justify-center
          font-bold text-white
          ${size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs"}
        `}
        style={{
          background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%) 0%, hsl(${(hue + 60) % 360}, 70%, 50%) 100%)`,
        }}
      >
        {address.slice(0, 2)}
      </div>
      {showAddress && (
        <span className="text-xs text-text-secondary font-mono">{truncated}</span>
      )}
    </div>
  );
}
