"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2 font-semibold
      transition-all duration-200 ease-out
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
    `;

    const variants = {
      primary: `
        bg-gradient-to-r from-neon-green to-neon-cyan text-bg-primary
        hover:shadow-glow-md hover:-translate-y-0.5
        active:translate-y-0
      `,
      secondary: `
        bg-transparent border border-neon-green text-neon-green
        hover:bg-neon-green/10 hover:shadow-glow-sm hover:-translate-y-0.5
        active:translate-y-0
      `,
      ghost: `
        bg-transparent text-text-secondary
        hover:text-neon-green hover:bg-neon-green/5
      `,
      danger: `
        bg-error/10 border border-error text-error
        hover:bg-error/20 hover:shadow-[0_0_20px_rgba(255,68,68,0.3)]
      `,
      success: `
        bg-success/10 border border-success text-success
        hover:bg-success/20 hover:shadow-glow-sm
      `,
    };

    const sizes = {
      xs: "text-xs px-2.5 py-1 rounded-md",
      sm: "text-xs px-3 py-1.5 rounded-lg",
      md: "text-sm px-4 py-2 rounded-lg",
      lg: "text-sm px-6 py-2.5 rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size={size} />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && icon}
            {children}
            {icon && iconPosition === "right" && icon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

// Spinner component
const Spinner = ({ size }: { size: string }) => {
  const sizeMap = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <svg
      className={`${sizeMap[size as keyof typeof sizeMap]} animate-spin`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export default Button;
export { Spinner };
