"use client";

import {
  Home,
  Car,
  CreditCard,
  Receipt,
  Wallet,
  Calendar,
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
  { id: "Receipt", Icon: Receipt, label: "Chitanță" },
  { id: "Wallet", Icon: Wallet, label: "Portofel" },
  { id: "Calendar", Icon: Calendar, label: "Calendar" },
  { id: "Heart", Icon: Heart, label: "Sănătate" },
  { id: "Utensils", Icon: Utensils, label: "Mâncare" },
  { id: "ShoppingCart", Icon: ShoppingCart, label: "Cumpărături" },
  { id: "Zap", Icon: Zap, label: "Energie" },
];

const iconById = new Map(UPCOMING_PAYMENT_ICONS.map((o) => [o.id, o]));

export function getUpcomingPaymentIcon(id: UpcomingPaymentIconId): LucideIcon {
  return iconById.get(id)?.Icon ?? Receipt;
}
