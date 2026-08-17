"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const TEAM_COLORS = {
  A: { text: "text-indigo-400", bg: "bg-indigo-500", soft: "bg-indigo-500/10", border: "border-indigo-500/40", hex: "#818cf8" },
  B: { text: "text-rose-400", bg: "bg-rose-500", soft: "bg-rose-500/10", border: "border-rose-500/40", hex: "#fb7185" },
} as const;

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function SectionCard({
  title,
  icon,
  description,
  action,
  className,
  children,
}: SectionCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn("border-white/10 bg-white/5", className)}>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                {icon}
                {title}
              </CardTitle>
              {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
            </div>
            {action}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: string;
}

export function StatTile({ label, value, hint, accent = "text-white" }: StatTileProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="truncate text-xs text-gray-400">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", accent)}>{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface RatingBarProps {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
}

export function RatingBar({ label, value, max = 10, suffix = "" }: RatingBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const tone =
    ratio >= 0.75 ? "bg-emerald-500" : ratio >= 0.5 ? "bg-indigo-500" : ratio >= 0.3 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="font-medium tabular-nums text-gray-200">
          {value}
          {suffix}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  className?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  rowKey: (row: T, index: number) => string;
}

export function DataTable<T>({ rows, columns, emptyMessage, rowKey }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500">{emptyMessage || "Nothing detected."}</p>;
  }

  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-3 py-2 text-xs font-medium whitespace-nowrap text-gray-400",
                  column.align === "right" ? "text-right" : "text-left"
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)} className="border-b border-white/5 last:border-0 hover:bg-white/5">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-3 py-2 whitespace-nowrap text-gray-300",
                    column.align === "right" ? "text-right tabular-nums" : "text-left",
                    column.className
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Jersey numbers are not always legible, so the model may return a placeholder
 * such as "unknown_maroon_1" to keep a player identifiable across events. That
 * never fits inside the round badge, so display splits into a short badge glyph
 * and a readable label.
 */
export function jerseyDisplay(value: string): {
  badge: string;
  short: string;
  label: string;
  known: boolean;
} {
  const raw = (value ?? "").trim();

  if (!raw || /^unknown$/i.test(raw)) {
    return { badge: "?", short: "?", label: "Unknown number", known: false };
  }

  if (/^\d{1,3}$/.test(raw)) {
    return { badge: raw, short: `#${raw}`, label: `#${raw}`, known: true };
  }

  // Placeholder ids: keep the trailing counter as the glyph when there is one.
  const counter = raw.match(/(\d{1,2})\s*$/);
  const readable = raw.replace(/[_-]+/g, " ").replace(/^unknown\s*/i, "").trim();
  const badge = counter ? `?${counter[1]}` : "?";

  return {
    badge,
    short: badge,
    label: readable ? `Unknown (${readable})` : "Unknown number",
    known: false,
  };
}

/** Compact jersey chip for dense places like tables, with the full identity on hover. */
export function JerseyTag({ number }: { number: string }) {
  const { short, label } = jerseyDisplay(number);
  return (
    <span title={label} className="whitespace-nowrap">
      {short}
    </span>
  );
}

interface JerseyBadgeProps {
  number: string;
  teamId?: "A" | "B";
  size?: "sm" | "md";
}

export function JerseyBadge({ number, teamId = "A", size = "md" }: JerseyBadgeProps) {
  const colors = TEAM_COLORS[teamId];
  const { badge, label } = jerseyDisplay(number);

  return (
    <span
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold whitespace-nowrap",
        colors.soft,
        colors.text,
        size === "sm" ? "h-6 w-6 text-[11px]" : "h-9 w-9 text-sm",
        badge.length > 2 && (size === "sm" ? "text-[9px]" : "text-xs")
      )}
    >
      {badge}
    </span>
  );
}

interface FilterChipsProps {
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterChips({ options, value, onChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            value === option.value
              ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
              : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200"
          )}
        >
          {option.label}
          {option.count !== undefined && <span className="ml-1 text-gray-500">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function EstimatedNote({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-xs text-gray-500">{children}</p>;
}
