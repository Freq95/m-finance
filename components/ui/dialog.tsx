"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [animatingOut, setAnimatingOut] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      setAnimatingOut(false);
      setVisible(true);
    } else {
      setAnimatingOut(true);
      const id = setTimeout(() => {
        setVisible(false);
        setAnimatingOut(false);
      }, 280);
      return () => clearTimeout(id);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange?.(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  if (!mounted || typeof document === "undefined") return null;
  if (!open && !visible) return null;

  const handleBackdropClick = () => {
    onOpenChange?.(false);
  };

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Blurred, dimmed overlay — liquid transition */}
      <div
        aria-hidden="true"
        onClick={handleBackdropClick}
        className={cn(
          "fixed inset-0 glass-overlay transition-opacity duration-normal ease-liquid",
          visible && !animatingOut ? "opacity-100" : "opacity-0"
        )}
      />
      {/* Glass content panel — liquid scale + fade */}
      <div
        className={cn(
          "relative z-[100] max-h-[90vh] overflow-auto transition-all duration-normal ease-liquid",
          visible && !animatingOut
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-[0.96] translate-y-2"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onClose?: () => void;
  }
>(({ className, children, onClose, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative w-full max-w-lg rounded-2xl glass-panel-elevated p-6 shadow-modal",
      "border border-white/20 dark:border-white/10",
      "text-[rgb(var(--foreground))]",
      className
    )}
    {...props}
  >
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-xl p-2 glass-surface border border-transparent opacity-70 transition-all duration-200 hover:opacity-100 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-accentPrimary/30 focus:ring-offset-2 disabled:pointer-events-none dark:hover:bg-white/10"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    )}
    {children}
  </div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-h2 font-medium leading-none tracking-tight text-textPrimary dark:text-white",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-textSecondary dark:text-gray-300", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
