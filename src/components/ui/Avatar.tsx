"use client";

import { ReactNode, useMemo } from "react";
import Image from "next/image";
import {
  generateAvatarGradient,
  generateIdenticonSVG,
  truncateAddress,
  getCloudinaryTransformedUrl,
} from "@/lib/utils/avatar";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string | ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
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
    "2xl": "w-24 h-24 text-2xl",
  };

  const statusSizes = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
    "2xl": "w-5 h-5",
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

// Address-based Avatar with Identicon
interface AddressAvatarProps {
  address: string;
  imageUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  showAddress?: boolean;
  onClick?: () => void;
  className?: string;
  badge?: ReactNode;
}

export function AddressAvatar({
  address,
  imageUrl,
  size = "md",
  showAddress = false,
  onClick,
  className = "",
  badge,
}: AddressAvatarProps) {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-24 h-24",
  };

  const textSizes = {
    xs: "text-[8px]",
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-lg",
    "2xl": "text-xl",
  };

  const pixelSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    "2xl": 96,
  };

  // Generate identicon or use custom image
  const avatarContent = useMemo(() => {
    if (imageUrl) {
      const transformedUrl = getCloudinaryTransformedUrl(imageUrl, pixelSizes[size], pixelSizes[size]);
      return (
        <Image
          src={transformedUrl}
          alt={`Avatar for ${truncateAddress(address)}`}
          fill
          className="object-cover"
          unoptimized={imageUrl.startsWith('data:')}
        />
      );
    }

    // Use identicon SVG
    const identiconUrl = generateIdenticonSVG(address, pixelSizes[size]);
    return (
      <Image
        src={identiconUrl}
        alt={`Avatar for ${truncateAddress(address)}`}
        fill
        className="object-cover"
        unoptimized
      />
    );
  }, [address, imageUrl, size]);

  const gradient = useMemo(() => generateAvatarGradient(address), [address]);

  return (
    <div
      className={`flex items-center gap-2 ${onClick ? "cursor-pointer hover:opacity-90 transition-opacity" : ""} ${className}`}
      onClick={onClick}
    >
      <div className="relative">
        <div
          className={`
            ${sizeClasses[size]}
            rounded-full overflow-hidden
            flex items-center justify-center
            font-bold text-white
            ${textSizes[size]}
            ring-2 ring-bg-tertiary
            relative
          `}
          style={{ background: gradient }}
        >
          {avatarContent}
        </div>
        {badge && (
          <div className="absolute -bottom-1 -right-1">
            {badge}
          </div>
        )}
      </div>
      {showAddress && (
        <span className="text-xs text-text-secondary font-mono">
          {truncateAddress(address)}
        </span>
      )}
    </div>
  );
}

// Legacy Wallet Avatar (for backwards compatibility) - Now uses identicon
interface WalletAvatarProps {
  address: string;
  size?: "xs" | "sm" | "md" | "lg";
  showAddress?: boolean;
  onClick?: () => void;
}

export function WalletAvatar({ address, size = "md", showAddress = true, onClick }: WalletAvatarProps) {
  const safeAddress = address || "0x0000000000000000";
  const truncated = truncateAddress(safeAddress);

  const sizeClasses = {
    xs: "w-5 h-5",
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const pixelSizes = {
    xs: 20,
    sm: 24,
    md: 32,
    lg: 40,
  };

  // Generate identicon SVG
  const identiconUrl = useMemo(
    () => generateIdenticonSVG(safeAddress, pixelSizes[size]),
    [safeAddress, size]
  );

  const gradient = useMemo(() => generateAvatarGradient(safeAddress), [safeAddress]);

  return (
    <div
      className={`flex items-center gap-2 ${onClick ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
      onClick={onClick}
    >
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full overflow-hidden
          ring-2 ring-bg-tertiary
          relative
        `}
        style={{ background: gradient }}
      >
        <Image
          src={identiconUrl}
          alt={`Avatar for ${truncated}`}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      {showAddress && (
        <span className="text-xs text-text-secondary font-mono">{truncated}</span>
      )}
    </div>
  );
}

// Profile Avatar with edit capability
interface ProfileAvatarProps {
  address: string;
  imageUrl?: string | null;
  size?: "lg" | "xl" | "2xl";
  editable?: boolean;
  onEditClick?: () => void;
  badge?: ReactNode;
  className?: string;
}

export function ProfileAvatar({
  address,
  imageUrl,
  size = "xl",
  editable = false,
  onEditClick,
  badge,
  className = "",
}: ProfileAvatarProps) {
  const sizeClasses = {
    lg: "w-16 h-16",
    xl: "w-24 h-24",
    "2xl": "w-32 h-32",
  };

  const pixelSizes = {
    lg: 64,
    xl: 96,
    "2xl": 128,
  };

  const gradient = useMemo(() => generateAvatarGradient(address), [address]);

  const avatarContent = useMemo(() => {
    if (imageUrl) {
      const transformedUrl = getCloudinaryTransformedUrl(imageUrl, pixelSizes[size], pixelSizes[size]);
      return (
        <Image
          src={transformedUrl}
          alt={`Profile avatar`}
          fill
          className="object-cover"
          unoptimized={imageUrl.startsWith('data:')}
        />
      );
    }

    const identiconUrl = generateIdenticonSVG(address, pixelSizes[size]);
    return (
      <Image
        src={identiconUrl}
        alt={`Profile avatar`}
        fill
        className="object-cover"
        unoptimized
      />
    );
  }, [address, imageUrl, size]);

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          rounded-2xl overflow-hidden
          flex items-center justify-center
          ring-4 ring-bg-tertiary
          relative
        `}
        style={{ background: gradient }}
      >
        {avatarContent}
      </div>

      {/* Badge position */}
      {badge && (
        <div className="absolute -bottom-2 -right-2">
          {badge}
        </div>
      )}

      {/* Edit button */}
      {editable && (
        <button
          onClick={onEditClick}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-bg-elevated border border-border-primary flex items-center justify-center hover:bg-bg-tertiary transition-colors group"
          title="Change avatar (Coming Soon)"
        >
          <svg
            className="w-4 h-4 text-text-muted group-hover:text-neon-green transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
