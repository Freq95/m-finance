import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl whitespace-nowrap text-sm font-normal transition-all duration-normal ease-liquid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentPrimary/30 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-accentPrimary text-white hover:bg-accentPrimaryHover shadow-soft hover:shadow-glass",
        secondary:
          "glass-surface text-textPrimary dark:text-white border border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10",
        danger:
          "bg-accentNegative text-white hover:bg-red-600 shadow-soft",
        ghost:
          "hover:bg-white/60 dark:hover:bg-white/10",
      },
      size: {
        default: "h-10 px-6 py-3",
        sm: "h-9 px-4",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
