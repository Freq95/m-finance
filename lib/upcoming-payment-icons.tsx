"use client";

import {
  Home,
  Car,
  CreditCard,
  Wallet,
  LandPlot,
  User,
  Heart,
  Utensils,
  ShoppingCart,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { UpcomingPaymentIconId } from "./types";

export const UPCOMING_PAYMENT_ICONS: {
  id: UpcomingPaymentIconId;
  Icon: LucideIcon;
  label: string;
}[] = [
  { id: "Home", Icon: Home, label: "Casă" },
  { id: "Car", Icon: Car, label: "Mașină" },
  { id: "CreditCard", Icon: CreditCard, label: "Card" },
  { id: "Wallet", Icon: Wallet, label: "Portofel" },
  { id: "Land", Icon: LandPlot, label: "Teren" },
  { id: "Id", Icon: User, label: "ID" },
  { id: "Heart", Icon: Heart, label: "Sănătate" },
  { id: "Utensils", Icon: Utensils, label: "Mâncare" },
  { id: "ShoppingCart", Icon: ShoppingCart, label: "Cumpărături" },
  { id: "Zap", Icon: Zap, label: "Energie" },
];

const iconById = new Map(UPCOMING_PAYMENT_ICONS.map((o) => [o.id, o]));

/** Deprecated icon ids from old data – map to a valid icon for display */
const deprecatedIconFallback: Record<string, LucideIcon> = {
  Receipt: Wallet,
  Calendar: Home,
};

export function getUpcomingPaymentIcon(id: string): LucideIcon {
  if (iconById.has(id as UpcomingPaymentIconId)) {
    return iconById.get(id as UpcomingPaymentIconId)!.Icon;
  }
  if (deprecatedIconFallback[id]) return deprecatedIconFallback[id];
  return UPCOMING_PAYMENT_ICONS[0].Icon;
}
