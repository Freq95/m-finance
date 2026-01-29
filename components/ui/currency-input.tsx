"use client";

import * as React from "react";
import { Input } from "./input";
import { formatRONValue, parseRON } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number;
  onChange: (value: number) => void;
  error?: boolean;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, error, className, onBlur, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(() =>
      value === 0 ? "" : formatRONValue(value)
    );

    const displayValue = focused ? inputValue : (value === 0 ? "" : formatRONValue(value));

    React.useEffect(() => {
      if (!focused) {
        setInputValue(value === 0 ? "" : formatRONValue(value));
      }
    }, [value, focused]);

    const handleFocus = () => {
      setFocused(true);
      setInputValue(value === 0 ? "" : formatRONValue(value));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      const parsed = parseRON(inputValue);
      const clamped = Math.max(0, parsed);
      if (clamped !== value) {
        onChange(clamped);
      }
      setInputValue(clamped === 0 ? "" : formatRONValue(clamped));
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setInputValue(raw);
      const parsed = parseRON(raw);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        onChange(parsed);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "-" || e.key === "e" || e.key === "E") {
        e.preventDefault();
      }
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="0,00"
          className={cn(
            "pr-12 text-right tabular-nums",
            error && "border-accentNegative focus-visible:ring-accentNegative",
            className
          )}
          {...props}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-textMuted dark:text-gray-400">
          RON
        </span>
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
