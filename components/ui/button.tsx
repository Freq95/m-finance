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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        ...props,
        className: cn(classes, child.props.className),
        ref: (child as { ref?: React.Ref<unknown> }).ref ?? ref,
      });
    }

    return (
      <button className={classes} ref={ref} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
