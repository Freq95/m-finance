import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/20 dark:border-white/10",
          "bg-white/50 dark:bg-white/5 backdrop-blur-sm",
          "px-3 py-2 text-sm transition-all duration-200",
          "placeholder:text-textMuted dark:placeholder:text-gray-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentPrimary/30 focus-visible:border-accentPrimary/40 focus-visible:bg-white/80 dark:focus-visible:bg-white/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "dark:text-gray-100",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
