"use client";

import { cn } from "@/lib/utils";

const panelHeight = "h-11";
const segmentBase =
  "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-normal ease-liquid min-w-[4rem] sm:min-w-0 inline-flex items-center justify-center gap-1.5";
const segmentSelected =
  "bg-white/90 dark:bg-white/20 text-textPrimary dark:text-white shadow-soft border border-white/20 dark:border-white/20";
const segmentUnselected =
  "text-textSecondary hover:text-textPrimary dark:text-gray-300 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10";
const segmentGroupBase = cn(
  "inline-flex items-center rounded-xl glass-surface border border-white/20 dark:border-white/10 p-1 shrink-0",
  panelHeight
);

export const segmentPanelStyles = {
  panelHeight,
  segmentBase,
  segmentSelected,
  segmentUnselected,
  segmentGroupBase,
};

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  /** When true, use compact padding (e.g. icon-only). */
  compact?: boolean;
}

interface SegmentPanelProps<T extends string> {
  segments: SegmentOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentPanel<T extends string>({
  segments,
  selectedValue,
  onSelect,
  ariaLabel,
  className,
}: SegmentPanelProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(segmentGroupBase, className)}
    >
      {segments.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          aria-label={opt.label}
          title={opt.label}
          className={cn(
            segmentBase,
            opt.compact && "px-2.5 min-w-0",
            selectedValue === opt.value ? segmentSelected : segmentUnselected
          )}
        >
          {opt.icon != null ? opt.icon : opt.label}
        </button>
      ))}
    </div>
  );
}

export function SegmentDivider() {
  return (
    <span
      className={cn("w-px bg-white/20 dark:bg-white/15 shrink-0", panelHeight)}
      aria-hidden
    />
  );
}
