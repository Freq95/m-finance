"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LineChart,
  Wallet,
  FileText,
  Trophy,
  FileBarChart,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Analytics", href: "/", icon: LineChart },
  { name: "Wallet", href: "/", icon: Wallet },
  { name: "Documents", href: "/monthly-input", icon: FileText, badge: 2 },
  { name: "Rewards", href: "/", icon: Trophy },
  { name: "Reports", href: "/", icon: FileBarChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 lg:hidden rounded-xl p-2.5 bg-black/20 backdrop-blur-xl text-white border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-[72px] bg-[#1F2937]/75 backdrop-blur-xl border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col items-center py-4">
          <div className="mb-5 flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
          </div>
          <nav className="flex flex-1 flex-col gap-0.5">
            {navigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/" && item.name === "Home"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "relative flex h-11 w-12 items-center justify-center text-white/65 transition-all duration-200 ease-out rounded-xl mx-1.5 hover:bg-white/10 hover:text-white",
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
                  <span className="relative">
                    <item.icon className="h-5 w-5" strokeWidth={2} />
                    {item.badge != null && (
                      <span
                        className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white shadow-sm"
                        aria-hidden="true"
                      >
                        {item.badge}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>
          <button
            className="mt-auto lg:hidden p-2.5 rounded-xl mx-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200"
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
