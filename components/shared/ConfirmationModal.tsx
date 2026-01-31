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
import { Input } from "@/components/ui/input";
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
  /** Require user to type this text to enable confirmation */
  confirmationText?: string;
  confirmationPlaceholder?: string;
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
  confirmationText,
  confirmationPlaceholder,
}: ConfirmationModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [typedText, setTypedText] = React.useState("");

  React.useEffect(() => {
    if (!open) setTypedText("");
  }, [open]);

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
        {confirmationText && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-[#E0E0E0]">
              Type <span className="font-semibold text-white">{confirmationText}</span> to
              confirm.
            </p>
            <Input
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={confirmationPlaceholder ?? ""}
              className="bg-[#383838] border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        )}
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
            disabled={loading || (confirmationText ? typedText !== confirmationText : false)}
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
