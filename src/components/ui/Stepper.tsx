"use client";

import { ReactNode } from "react";

interface Step {
  id: string | number;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  variant?: "horizontal" | "vertical";
  size?: "sm" | "md";
  onStepClick?: (step: number) => void;
}

export default function Stepper({
  steps,
  currentStep,
  variant = "horizontal",
  size = "md",
  onStepClick,
}: StepperProps) {
  const isHorizontal = variant === "horizontal";

  return (
    <div className={`${isHorizontal ? "flex items-center" : "flex flex-col"}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div
            key={step.id}
            className={`
              ${isHorizontal ? "flex items-center flex-1" : "flex items-start"}
              ${isLast && isHorizontal ? "flex-none" : ""}
            `}
          >
            {/* Step Circle & Content */}
            <div
              className={`
                flex items-center gap-2
                ${onStepClick ? "cursor-pointer" : ""}
              `}
              onClick={() => onStepClick?.(index)}
            >
              {/* Circle */}
              <div
                className={`
                  relative flex items-center justify-center rounded-full
                  transition-all duration-300
                  ${size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"}
                  ${
                    isCompleted
                      ? "bg-neon-green text-bg-primary"
                      : isActive
                      ? "bg-neon-green/20 text-neon-green border-2 border-neon-green shadow-glow-sm"
                      : "bg-bg-tertiary text-text-muted border border-border-secondary"
                  }
                `}
              >
                {isCompleted ? (
                  <CheckIcon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
                ) : step.icon ? (
                  step.icon
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}

                {/* Active pulse */}
                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-neon-green/30 animate-ping" />
                )}
              </div>

              {/* Label */}
              <div className={`${isHorizontal && !isLast ? "hidden md:block" : ""}`}>
                <p
                  className={`
                    font-medium transition-colors
                    ${size === "sm" ? "text-xs" : "text-sm"}
                    ${isActive ? "text-neon-green" : isCompleted ? "text-text-primary" : "text-text-muted"}
                  `}
                >
                  {step.label}
                </p>
                {step.description && variant === "vertical" && (
                  <p className="text-xs text-text-muted mt-0.5">{step.description}</p>
                )}
              </div>
            </div>

            {/* Connector */}
            {!isLast && (
              <div
                className={`
                  ${isHorizontal ? "flex-1 mx-3 h-0.5" : "ml-4 my-2 w-0.5 h-8"}
                  rounded-full overflow-hidden
                  ${isCompleted ? "bg-neon-green" : "bg-border-secondary"}
                `}
              >
                {isActive && (
                  <div
                    className={`
                      ${isHorizontal ? "h-full w-1/2" : "w-full h-1/2"}
                      bg-gradient-to-r from-neon-green to-transparent
                      animate-pulse
                    `}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Mini Stepper (for modals)
interface MiniStepperProps {
  total: number;
  current: number;
}

export function MiniStepper({ total, current }: MiniStepperProps) {
  return (
    <div className="flex items-center gap-1.5">
      {[...Array(total)].map((_, i) => (
        <div
          key={i}
          className={`
            h-1 rounded-full transition-all duration-300
            ${i === current ? "w-6 bg-neon-green shadow-glow-sm" : "w-1.5"}
            ${i < current ? "bg-neon-green/60" : "bg-border-secondary"}
          `}
        />
      ))}
    </div>
  );
}

// Step indicator text
interface StepIndicatorProps {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-neon-green font-semibold">{current}</span>
      <span className="text-text-muted">/</span>
      <span className="text-text-muted">{total}</span>
    </div>
  );
}

// Icon
const CheckIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);
