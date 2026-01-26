"use client";

import { forwardRef, InputHTMLAttributes, ReactNode, useState } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  suffix?: ReactNode;
  prefix?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      iconPosition = "left",
      suffix,
      prefix,
      className = "",
      type = "text",
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          {/* Prefix */}
          {prefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {prefix}
            </div>
          )}

          {/* Icon */}
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={isPassword && showPassword ? "text" : type}
            className={`
              w-full px-3 py-2 text-sm
              bg-bg-secondary border border-border-secondary rounded-lg
              text-text-primary placeholder:text-text-muted
              transition-all duration-200
              focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green/20
              hover:border-border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon && iconPosition === "left" ? "pl-9" : ""}
              ${icon && iconPosition === "right" ? "pr-9" : ""}
              ${prefix ? "pl-9" : ""}
              ${suffix || isPassword ? "pr-9" : ""}
              ${error ? "border-error focus:border-error focus:ring-error/20" : ""}
              ${className}
            `}
            {...props}
          />

          {/* Icon right or Password toggle */}
          {(icon && iconPosition === "right") || isPassword ? (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              onClick={isPassword ? () => setShowPassword(!showPassword) : undefined}
            >
              {isPassword ? (
                showPassword ? <EyeOffIcon /> : <EyeIcon />
              ) : (
                icon
              )}
            </button>
          ) : null}

          {/* Suffix */}
          {suffix && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">
              {suffix}
            </div>
          )}
        </div>

        {/* Error or Hint */}
        {(error || hint) && (
          <p className={`mt-1 text-xs ${error ? "text-error" : "text-text-muted"}`}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

// Amount Input with token selector
interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "prefix"> {
  token?: string;
  tokens?: string[];
  onTokenChange?: (token: string) => void;
  balance?: string;
  onMaxClick?: () => void;
  error?: string;
}

export function AmountInput({
  token = "SOL",
  tokens,
  onTokenChange,
  balance,
  onMaxClick,
  error,
  ...props
}: AmountInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-text-secondary">Amount</label>
        {balance && (
          <span className="text-xs text-text-muted">
            <span className="text-text-secondary">{balance}</span>
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="number"
          step="any"
          className={`
            w-full px-3 py-3 text-lg font-medium
            bg-bg-secondary border rounded-xl
            text-text-primary placeholder:text-text-muted
            transition-all duration-200
            focus:outline-none focus:ring-1
            pr-24
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            ${error
              ? "border-error focus:border-error focus:ring-error/20"
              : "border-border-secondary focus:border-neon-green focus:ring-neon-green/20"
            }
          `}
          placeholder="0.00"
          {...props}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {onMaxClick && (
            <button
              type="button"
              onClick={onMaxClick}
              className="px-2 py-0.5 text-xs font-medium text-neon-green hover:bg-neon-green/10 rounded transition-colors"
            >
              MAX
            </button>
          )}

          {tokens && onTokenChange ? (
            <select
              value={token}
              onChange={(e) => onTokenChange(e.target.value)}
              className="bg-bg-tertiary border border-border-primary rounded-lg px-2 py-1 text-sm font-medium text-text-primary focus:outline-none focus:border-neon-green"
            >
              {tokens.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          ) : (
            <span className="px-2 py-1 text-sm font-medium text-text-secondary bg-bg-tertiary rounded-lg">
              {token}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}

// Search Input
interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "prefix"> {
  onClear?: () => void;
}

export function SearchInput({ onClear, value, ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      <input
        type="search"
        value={value}
        className={`
          w-full pl-9 pr-8 py-2 text-sm
          bg-bg-secondary border border-border-secondary rounded-lg
          text-text-primary placeholder:text-text-muted
          transition-all duration-200
          focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green/20
        `}
        placeholder="Search..."
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// Icons
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const SearchIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CloseIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
