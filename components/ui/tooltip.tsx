"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  /** "glass" = transparent + backdrop blur + soft border (like glass-panel) */
  variant?: "default" | "glass";
}

const OFFSET = 8;

export function Tooltip({
  children,
  content,
  side = "top",
  className,
  variant = "default",
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = 0;
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

    switch (side) {
      case "top":
        top = rect.top - tooltipRect.height - OFFSET;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + OFFSET;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left - tooltipRect.width - OFFSET;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + OFFSET;
        break;
    }

    setPosition({ top, left });
  }, [side]);

  React.useEffect(() => {
    if (!isVisible) return;
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, updatePosition]);

  const tooltipContent = isVisible && (
    <div
      ref={tooltipRef}
      className={cn(
        "fixed z-[9999] max-w-[min(90vw,320px)] px-3 py-2.5 text-sm text-white",
        variant === "glass"
          ? "glass-tooltip-blur rounded-xl"
          : "rounded-lg bg-gray-900 shadow-xl ring-1 ring-white/10",
        className
      )}
      role="tooltip"
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      {content}
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {typeof document !== "undefined" && createPortal(tooltipContent, document.body)}
    </>
  );
}
