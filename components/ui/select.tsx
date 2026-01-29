import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-10 w-full appearance-none rounded-xl border border-white/20 dark:border-white/10",
          "bg-white/50 dark:bg-white/5 backdrop-blur-sm",
          "px-3 py-2 pr-8 text-sm transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentPrimary/30 focus-visible:border-accentPrimary/40 focus-visible:bg-white/80 dark:focus-visible:bg-white/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:text-gray-100 dark:placeholder:text-gray-500",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted dark:text-gray-400" />
    </div>
  );
});
Select.displayName = "Select";

export { Select };
