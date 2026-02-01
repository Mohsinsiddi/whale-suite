"use client";

import { motion } from "framer-motion";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
}: ToggleProps) {
  const sizes = {
    sm: {
      track: "w-8 h-4",
      thumb: "w-3 h-3",
      translate: "translate-x-4",
    },
    md: {
      track: "w-11 h-6",
      thumb: "w-5 h-5",
      translate: "translate-x-5",
    },
    lg: {
      track: "w-14 h-7",
      thumb: "w-6 h-6",
      translate: "translate-x-7",
    },
  };

  const sizeClasses = sizes[size];

  return (
    <label
      className={`flex items-center gap-3 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex shrink-0 rounded-full
          ${sizeClasses.track}
          transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
          ${checked ? "bg-neon-green" : "bg-bg-elevated"}
          ${disabled ? "" : "hover:opacity-90"}
        `}
      >
        <motion.span
          initial={false}
          animate={{
            x: checked ? (size === "sm" ? 16 : size === "lg" ? 28 : 20) : 2,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`
            ${sizeClasses.thumb}
            rounded-full bg-white shadow-lg
            pointer-events-none inline-block
            absolute top-0.5 left-0
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <span className="text-sm font-medium text-text-primary">
              {label}
            </span>
          )}
          {description && (
            <p className="text-xs text-text-muted mt-0.5">{description}</p>
          )}
        </div>
      )}
    </label>
  );
}

// Toggle Group for multiple options
interface ToggleGroupProps {
  options: Array<{
    id: string;
    label: string;
    description?: string;
    checked: boolean;
  }>;
  onChange: (id: string, checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleGroup({ options, onChange, disabled }: ToggleGroupProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <Toggle
          key={option.id}
          checked={option.checked}
          onChange={(checked) => onChange(option.id, checked)}
          label={option.label}
          description={option.description}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
