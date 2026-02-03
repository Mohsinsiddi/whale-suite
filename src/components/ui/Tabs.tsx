"use client";

import { ReactNode, useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: "default" | "pills" | "underline";
  size?: "sm" | "md";
  fullWidth?: boolean;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "default",
  size = "md",
  fullWidth = false,
}: TabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id);
  const active = activeTab ?? internalActive;

  const handleChange = (tabId: string) => {
    setInternalActive(tabId);
    onChange?.(tabId);
  };

  const baseStyles = "flex items-center gap-1.5 font-medium transition-all duration-200";

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
  };

  const variants = {
    default: {
      container: "flex gap-1 p-1 bg-bg-secondary rounded-lg",
      tab: (isActive: boolean) =>
        isActive
          ? "bg-bg-tertiary text-neon-green rounded-md"
          : "text-text-muted hover:text-text-secondary",
    },
    pills: {
      container: "flex gap-2",
      tab: (isActive: boolean) =>
        isActive
          ? "bg-neon-green/10 text-neon-green border border-neon-green/30 rounded-full"
          : "text-text-muted hover:text-text-secondary border border-transparent",
    },
    underline: {
      container: "flex gap-4 border-b border-border-secondary",
      tab: (isActive: boolean) =>
        isActive
          ? "text-neon-green border-b-2 border-neon-green -mb-px"
          : "text-text-muted hover:text-text-secondary border-b-2 border-transparent -mb-px",
    },
  };

  return (
    <div className={`${variants[variant].container} ${fullWidth ? "w-full" : ""}`}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const isDisabled = tab.disabled === true;
        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && handleChange(tab.id)}
            disabled={isDisabled}
            className={`
              ${baseStyles}
              ${sizes[size]}
              ${isDisabled
                ? "opacity-40 cursor-not-allowed text-text-muted"
                : variants[variant].tab(isActive)}
              ${fullWidth ? "flex-1 justify-center" : ""}
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="min-w-[16px] h-4 px-1 text-[10px] font-bold bg-neon-green text-bg-primary rounded-full flex items-center justify-center">
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Tab Panel
interface TabPanelProps {
  children: ReactNode;
  value: string;
  activeValue: string;
  className?: string;
}

export function TabPanel({ children, value, activeValue, className = "" }: TabPanelProps) {
  if (value !== activeValue) return null;

  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}
