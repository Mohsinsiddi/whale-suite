"use client";

import Link from "next/link";

interface LearnMoreLinkProps {
  section: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * LearnMoreLink - Links to docs page with a specific section
 *
 * Usage:
 *   <LearnMoreLink section="privacy" />
 *   <LearnMoreLink section="confidential">Learn about INCO FHE</LearnMoreLink>
 *
 * Valid sections:
 *   - privacy, confidential, trading, predictions, analytics, launch
 *   - overview, features, rewards, partners, business
 *   - Aliases: inco, fhe, channels, swap, jupiter, darklake, pnp, markets,
 *     shadowwire, ghost-send, transfer, anoncoin, token-launch, points, badges
 */
export default function LearnMoreLink({
  section,
  className = "",
  children
}: LearnMoreLinkProps) {
  return (
    <Link
      href={`/docs?section=${section}`}
      className={`inline-flex items-center gap-1 text-sm text-neon-cyan hover:text-neon-green transition-colors ${className}`}
    >
      {children || "Learn more"}
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </Link>
  );
}

// Compact version for inline use
export function DocsLink({
  section,
  children
}: {
  section: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/docs?section=${section}`}
      className="text-neon-cyan hover:text-neon-green underline underline-offset-2 transition-colors"
    >
      {children}
    </Link>
  );
}
