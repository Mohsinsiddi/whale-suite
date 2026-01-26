"use client";

import { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "glow" | "feature" | "stat" | "pricing" | "vault";
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

export default function Card({
  variant = "default",
  hover = true,
  padding = "md",
  children,
  className = "",
  ...props
}: CardProps) {
  const baseStyles = `
    relative overflow-hidden rounded-xl
    transition-all duration-300 ease-out
  `;

  const variants = {
    default: `
      bg-gradient-to-br from-bg-secondary to-bg-tertiary
      border border-border-primary
      ${hover ? "hover:-translate-y-1 hover:border-neon-green/40 hover:shadow-glow-sm" : ""}
    `,
    elevated: `
      bg-bg-elevated
      border border-border-secondary
      shadow-lg
      ${hover ? "hover:-translate-y-1 hover:shadow-xl" : ""}
    `,
    glow: `
      bg-gradient-to-br from-bg-secondary to-bg-tertiary
      border border-neon-green/30
      shadow-glow-sm
      ${hover ? "hover:border-neon-green/60 hover:shadow-glow-md" : ""}
    `,
    feature: `
      bg-gradient-to-br from-bg-secondary to-bg-tertiary
      border border-border-primary
      before:absolute before:inset-0 before:bg-gradient-to-br before:from-neon-green/10 before:to-transparent before:opacity-0 before:transition-opacity
      ${hover ? "hover:-translate-y-2 hover:border-neon-green/40 hover:shadow-glow-sm hover:before:opacity-100" : ""}
    `,
    stat: `
      bg-bg-secondary/50 backdrop-blur-sm
      border border-border-primary
      text-center
      ${hover ? "hover:border-neon-green/40 hover:shadow-glow-sm" : ""}
    `,
    pricing: `
      bg-gradient-to-br from-bg-secondary to-bg-tertiary
      border border-border-primary
      text-center
      ${hover ? "hover:-translate-y-1 hover:border-neon-green/40" : ""}
    `,
    vault: `
      bg-gradient-to-br from-bg-secondary to-bg-tertiary
      border border-border-primary
      before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-neon-green before:to-neon-cyan before:opacity-0 before:transition-opacity
      ${hover ? "hover:border-neon-green/40 hover:shadow-glow-sm hover:before:opacity-100" : ""}
    `,
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Sub-components for structured cards
export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`text-sm font-semibold text-text-primary ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-xs text-text-secondary ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-4 pt-3 border-t border-border-secondary ${className}`}>
      {children}
    </div>
  );
}
