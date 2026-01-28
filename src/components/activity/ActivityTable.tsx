'use client';

/**
 * ActivityTable - Reusable activity/history table component
 * Used across cards, transfer, swap pages etc.
 */

import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CreditCard,
  Send,
  ArrowRightLeft,
  Shield,
  Dices,
} from 'lucide-react';

export type ActivityCategory = 'cards' | 'shadowwire' | 'privacy-cash' | 'swap' | 'pnp' | 'all';

export interface ActivityItem {
  id: string;
  type: ActivityCategory;
  action: string;
  description?: string;
  amount?: number;
  amountLabel?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'issued';
  timestamp: Date | string;
  txSignature?: string;
  metadata?: Record<string, unknown>;
  onAction?: () => void;
  actionLabel?: string;
}

interface ActivityTableProps {
  items: ActivityItem[];
  loading?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
  showCategory?: boolean;
  maxItems?: number;
}

const categoryIcons: Record<ActivityCategory, typeof CreditCard> = {
  cards: CreditCard,
  shadowwire: Send,
  'privacy-cash': Shield,
  swap: ArrowRightLeft,
  pnp: Dices,
  all: Clock,
};

const categoryColors: Record<ActivityCategory, string> = {
  cards: 'text-orange-400',
  shadowwire: 'text-neon-cyan',
  'privacy-cash': 'text-neon-green',
  swap: 'text-purple-400',
  pnp: 'text-yellow-400',
  all: 'text-text-muted',
};

const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  completed: 'success',
  issued: 'success',
  processing: 'info',
  pending: 'warning',
  failed: 'error',
  expired: 'error',
};

function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ActivityTable({
  items,
  loading = false,
  onRefresh,
  emptyMessage = 'No activity yet',
  showCategory = false,
  maxItems = 10,
}: ActivityTableProps) {
  const [expanded, setExpanded] = useState(false);

  const displayItems = expanded ? items : items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-muted">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading activity...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-text-muted">
        <Clock className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-text-muted uppercase tracking-wider">
          Recent Activity ({items.length})
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1 rounded hover:bg-bg-elevated transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border-primary overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-elevated/50 text-xs text-text-muted uppercase tracking-wider">
              {showCategory && <th className="px-3 py-2 text-left w-10">Type</th>}
              <th className="px-3 py-2 text-left">Action</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-right">Time</th>
              <th className="px-3 py-2 text-center w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary/50">
            {displayItems.map((item) => {
              const Icon = categoryIcons[item.type] || Clock;
              const iconColor = categoryColors[item.type] || 'text-text-muted';

              return (
                <tr
                  key={item.id}
                  className="hover:bg-bg-elevated/30 transition-colors"
                >
                  {showCategory && (
                    <td className="px-3 py-2.5">
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </td>
                  )}
                  <td className="px-3 py-2.5">
                    <div>
                      <p className="text-sm text-text-primary font-medium">{item.action}</p>
                      {item.description && (
                        <p className="text-xs text-text-muted truncate max-w-[200px]">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {item.amount !== undefined ? (
                      <span className="text-sm font-mono text-text-primary">
                        {item.amountLabel || `$${item.amount}`}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge
                      variant={statusVariants[item.status] || 'default'}
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-xs text-text-muted" title={formatDateTime(item.timestamp)}>
                      {formatTime(item.timestamp)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {item.txSignature ? (
                      <a
                        href={`https://solscan.io/tx/${item.txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : item.onAction ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={item.onAction}
                        className="text-xs px-2 py-1"
                      >
                        {item.actionLabel || 'View'}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show more/less */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-2 text-xs text-text-muted hover:text-neon-green transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Show {items.length - maxItems} more
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default ActivityTable;
