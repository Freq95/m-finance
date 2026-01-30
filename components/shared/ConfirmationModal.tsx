"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  /** "danger" for destructive actions (e.g. delete, clear); default is teal primary */
  variant?: "default" | "danger";
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Anulare",
  onConfirm,
  variant = "default",
}: ConfirmationModalProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className={cn(
          "max-w-md rounded-xl border border-white/10 bg-[#2C2C2C] p-6 shadow-modal",
          "text-white"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm font-normal text-[#E0E0E0]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex justify-end gap-2 sm:gap-2">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="border-white/10 bg-[#383838] text-white hover:bg-[#404040] dark:border-white/10 dark:bg-[#383838] dark:text-white dark:hover:bg-[#404040]"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              variant === "default" &&
                "bg-[#2E8B81] text-white hover:bg-[#267a72] dark:bg-[#2E8B81] dark:text-white dark:hover:bg-[#267a72]"
            )}
          >
            {loading ? "..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
