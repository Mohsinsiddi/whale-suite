"use client";

import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "cyan";
  size?: "xs" | "sm" | "md";
  dot?: boolean;
  pulse?: boolean;
  icon?: ReactNode;
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  pulse = false,
  icon,
  className = "",
}: BadgeProps) {
  const variants = {
    default: "bg-neon-green/10 text-neon-green border-neon-green/30",
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    error: "bg-error/10 text-error border-error/30",
    info: "bg-info/10 text-info border-info/30",
    cyan: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30",
  };

  const sizes = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  const dotColors = {
    default: "bg-neon-green",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
    info: "bg-info",
    cyan: "bg-neon-cyan",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium border rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${dotColors[variant]}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}`} />
        </span>
      )}
      {icon}
      {children}
    </span>
  );
}

// Tier Badge (for NFT badges)
interface TierBadgeProps {
  tier: "bronze" | "silver" | "gold" | "diamond" | "legendary";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function TierBadge({ tier, size = "md", showLabel = true }: TierBadgeProps) {
  const tiers = {
    bronze: {
      bg: "bg-gradient-to-r from-amber-700 to-amber-600",
      border: "border-amber-500/50",
      text: "text-amber-200",
      glow: "shadow-[0_0_15px_rgba(180,83,9,0.3)]",
      icon: "🥉",
      label: "Bronze",
    },
    silver: {
      bg: "bg-gradient-to-r from-slate-400 to-slate-300",
      border: "border-slate-300/50",
      text: "text-slate-900",
      glow: "shadow-[0_0_15px_rgba(148,163,184,0.3)]",
      icon: "🥈",
      label: "Silver",
    },
    gold: {
      bg: "bg-gradient-to-r from-yellow-500 to-amber-400",
      border: "border-yellow-400/50",
      text: "text-yellow-900",
      glow: "shadow-[0_0_15px_rgba(234,179,8,0.4)]",
      icon: "🥇",
      label: "Gold",
    },
    diamond: {
      bg: "bg-gradient-to-r from-cyan-400 to-blue-400",
      border: "border-cyan-300/50",
      text: "text-cyan-900",
      glow: "shadow-[0_0_20px_rgba(34,211,238,0.4)]",
      icon: "💎",
      label: "Diamond",
    },
    legendary: {
      bg: "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500",
      border: "border-purple-400/50",
      text: "text-white",
      glow: "shadow-[0_0_25px_rgba(168,85,247,0.5)]",
      icon: "👑",
      label: "Legendary",
    },
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  const config = tiers[tier];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-semibold rounded-full border
        ${config.bg} ${config.border} ${config.text} ${config.glow}
        ${sizes[size]}
      `}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

// Status Badge
interface StatusBadgeProps {
  status: "online" | "offline" | "busy" | "away";
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function StatusBadge({ status, showLabel = false, size = "sm" }: StatusBadgeProps) {
  const statuses = {
    online: { color: "bg-success", label: "Online" },
    offline: { color: "bg-text-muted", label: "Offline" },
    busy: { color: "bg-error", label: "Busy" },
    away: { color: "bg-warning", label: "Away" },
  };

  const config = statuses[status];

  return (
    <span className={`inline-flex items-center gap-1.5 ${size === "md" ? "text-xs" : "text-[10px]"}`}>
      <span className="relative flex h-2 w-2">
        {status === "online" && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75 animate-ping`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`} />
      </span>
      {showLabel && <span className="text-text-secondary">{config.label}</span>}
    </span>
  );
}

// Count Badge (for notifications)
interface CountBadgeProps {
  count: number;
  max?: number;
}

export function CountBadge({ count, max = 99 }: CountBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-error text-white rounded-full">
      {displayCount}
    </span>
  );
}
