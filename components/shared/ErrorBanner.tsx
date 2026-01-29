"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
}

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  retryLabel = "Retry",
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800"
    >
      <div className="flex items-center gap-2 min-w-0">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
        <span>{message}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="border-red-200 bg-white hover:bg-red-50 text-red-800"
          >
            {retryLabel}
          </Button>
        )}
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}
