"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FilePenLine,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Monthly input", href: "/monthly-input", icon: FilePenLine },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 lg:hidden rounded-2xl p-2.5 glass-panel-dark border border-white/10 text-white shadow-glass transition-all duration-normal ease-liquid"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 glass-overlay lg:hidden transition-opacity duration-normal"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-[72px] glass-panel-dark border-r border-white/10 shadow-glass transition-transform duration-normal ease-liquid",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col items-center py-4">
          <nav className="flex flex-1 flex-col gap-0.5">
            {navigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/" && item.name === "Dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "relative flex h-11 w-12 items-center justify-center text-white/70 transition-all duration-normal ease-liquid rounded-xl mx-1.5 hover:bg-white/10 hover:text-white",
                    isActive && "text-white"
                  )}
                  title={item.name}
                  aria-label={item.name}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-white/90"
                      aria-hidden="true"
                    />
                  )}
                  <item.icon className="h-5 w-5" strokeWidth={2} />
                </Link>
              );
            })}
          </nav>
          <button
            className="mt-auto lg:hidden p-2.5 rounded-xl mx-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-all duration-normal ease-liquid"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </aside>
    </>
  );
}
