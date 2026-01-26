"use client";

import { ReactNode } from "react";

// Table Root
interface TableProps {
  children: ReactNode;
  className?: string;
}

export default function Table({ children, className = "" }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

// Table Header
export function TableHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <thead className={className}>{children}</thead>;
}

// Table Body
export function TableBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tbody className={`divide-y divide-border-secondary ${className}`}>{children}</tbody>;
}

// Table Row
interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function TableRow({ children, className = "", onClick, hoverable = true }: TableRowProps) {
  return (
    <tr
      className={`
        ${hoverable ? "hover:bg-neon-green/5 transition-colors" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

// Table Head Cell
interface TableHeadProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  sorted?: "asc" | "desc" | null;
  onSort?: () => void;
}

export function TableHead({
  children,
  className = "",
  align = "left",
  sortable = false,
  sorted = null,
  onSort,
}: TableHeadProps) {
  const alignments = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <th
      className={`
        px-3 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider
        border-b border-border-secondary
        ${alignments[align]}
        ${sortable ? "cursor-pointer hover:text-text-secondary transition-colors" : ""}
        ${className}
      `}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <span className="flex flex-col">
            <ChevronUpIcon
              className={`w-2.5 h-2.5 ${sorted === "asc" ? "text-neon-green" : "text-text-disabled"}`}
            />
            <ChevronDownIcon
              className={`w-2.5 h-2.5 -mt-1 ${sorted === "desc" ? "text-neon-green" : "text-text-disabled"}`}
            />
          </span>
        )}
      </div>
    </th>
  );
}

// Table Cell
interface TableCellProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function TableCell({ children, className = "", align = "left" }: TableCellProps) {
  const alignments = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <td className={`px-3 py-3 text-text-primary ${alignments[align]} ${className}`}>
      {children}
    </td>
  );
}

// Empty State
interface TableEmptyProps {
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  colSpan?: number;
}

export function TableEmpty({
  message = "No data available",
  icon,
  action,
  colSpan = 1,
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-12 text-center">
        <div className="flex flex-col items-center gap-2">
          {icon || <EmptyIcon className="w-10 h-10 text-text-muted" />}
          <p className="text-sm text-text-muted">{message}</p>
          {action}
        </div>
      </td>
    </tr>
  );
}

// Loading State
export function TableLoading({ colSpan = 1, rows = 5 }: { colSpan?: number; rows?: number }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i}>
          <td colSpan={colSpan} className="px-3 py-3">
            <div className="h-4 bg-bg-tertiary rounded animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  );
}

// Icons
const ChevronUpIcon = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const EmptyIcon = ({ className = "w-10 h-10" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);
