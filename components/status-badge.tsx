import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone =
  | "green"
  | "gray"
  | "amber"
  | "red"
  | "blue"
  | "indigo"
  | "purple"
  | "yellow";

const TONES: Record<Tone, { badge: string; dot: string }> = {
  green: { badge: "bg-green-50 text-green-700 ring-green-600/20", dot: "bg-green-500" },
  gray: { badge: "bg-gray-50 text-gray-600 ring-gray-500/20", dot: "bg-gray-400" },
  amber: { badge: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  red: { badge: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-500" },
  blue: { badge: "bg-blue-50 text-blue-700 ring-blue-600/20", dot: "bg-blue-500" },
  indigo: { badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", dot: "bg-indigo-500" },
  purple: { badge: "bg-purple-50 text-purple-700 ring-purple-600/20", dot: "bg-purple-500" },
  yellow: { badge: "bg-yellow-50 text-yellow-800 ring-yellow-600/20", dot: "bg-yellow-500" },
};

export function StatusBadge({
  tone = "gray",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  const style = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset",
        style.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden="true" />
      {children}
    </span>
  );
}

// One place decides what colour each status gets, so every page agrees
export const PRODUCT_STATUS_TONE: Record<string, Tone> = {
  active: "green",
  draft: "gray",
  archived: "amber",
};

export const ORDER_STATUS_TONE: Record<string, Tone> = {
  pending: "yellow",
  confirmed: "blue",
  processing: "indigo",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
};

export const PAYMENT_STATUS_TONE: Record<string, Tone> = {
  pending: "yellow",
  paid: "green",
  failed: "red",
  refunded: "gray",
};
