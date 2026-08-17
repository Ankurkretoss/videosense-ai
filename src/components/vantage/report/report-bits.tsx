"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Shared pieces for the match report, styled exactly like the VantageAI design. */

export const EVENT_COLORS = {
  goal: "#34D399",
  shot: "#A78BFA",
  save: "#FBBF24",
  card: "#F87171",
  defensive: "#60A5FA",
  tactical: "#FBBF24",
  other: "#8A8A98",
} as const;

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-[14px] border border-white/[0.11] bg-panel", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("text-[13px] font-bold text-ink-400", className)}>{children}</div>
  );
}

export function StatCell({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="rounded-[9px] bg-white/[0.03] p-2.5">
      <div className="font-mono-num text-[14px] text-ink-200">{value}</div>
      <div className="mt-0.5 text-[10.5px] text-mute-3">{label}</div>
    </div>
  );
}

export function BarRow({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="flex justify-between text-[11.5px] text-mute">
        <span>{label}</span>
        <span className="font-mono-num">{clamped}</span>
      </div>
      <div className="mt-1.5 h-[5px] overflow-hidden rounded-[3px] bg-white/[0.09]">
        <div
          className="h-full bg-gradient-to-r from-[#6B49FF] to-[#A78BFA]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

/** Two-sided comparison bar: left side grey and right-aligned, right side gradient. */
export function VersusRow({
  label,
  left,
  right,
  leftPercent,
  rightPercent,
}: {
  label: string;
  left: string;
  right: string;
  leftPercent: number;
  rightPercent: number;
}) {
  return (
    <div>
      <div className="font-mono-num flex items-center justify-between gap-3 text-[13px] text-ink-300">
        <span>{left}</span>
        <span className="font-sans text-[12px] font-semibold text-mute-2">{label}</span>
        <span>{right}</span>
      </div>
      <div className="mt-1.5 flex gap-1">
        <div className="flex h-1.5 flex-1 justify-end overflow-hidden rounded-[3px] bg-white/[0.05]">
          <div
            className="rounded-[3px] bg-[#4A4A58]"
            style={{ width: `${Math.max(0, Math.min(100, leftPercent))}%` }}
          />
        </div>
        <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-white/[0.05]">
          <div
            className="rounded-[3px] bg-gradient-to-r from-[#6B49FF] to-[#A78BFA]"
            style={{ width: `${Math.max(0, Math.min(100, rightPercent))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/** Vertically striped pitch, as used by the tactics and map panels. */
export function PitchFrame({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[3/2] overflow-hidden rounded-[10px] border border-white/10",
        className
      )}
      style={{
        background: "repeating-linear-gradient(90deg, #0F1C14 0 34px, #0D1811 34px 68px)",
      }}
    >
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/[0.14]" />
      <div className="absolute top-1/2 left-1/2 -mt-[42px] -ml-[42px] h-[84px] w-[84px] rounded-full border border-white/[0.13]" />
      <div className="absolute inset-y-[26%] left-0 w-[13%] border border-white/[0.12]" />
      <div className="absolute inset-y-[26%] right-0 w-[13%] border border-white/[0.12]" />
      {children}
    </div>
  );
}

export function Legend({ items }: { items: { color: string; label: string; wide?: boolean }[] }) {
  return (
    <div className="mt-3.5 flex flex-wrap gap-4 text-[11.5px] text-mute-2">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <span
            className={cn("shrink-0", item.wide ? "h-1.5 w-3 rounded-sm" : "h-[9px] w-[9px] rounded-full")}
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number | string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 border-b-2 px-4 py-3 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
        active ? "border-brand text-ink-100" : "border-transparent text-mute-2 hover:text-ink-300"
      )}
    >
      {label}
      {count !== undefined && count !== 0 && (
        <span className="font-mono-num ml-2 text-[11px] text-mute-3">{count}</span>
      )}
    </button>
  );
}

export function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono-num rounded-lg border border-white/[0.11] bg-panel-3 px-2.5 py-1.5 text-[12px] text-ink-400">
      {children}
    </span>
  );
}

export function SectionEyebrow({
  children,
  color = "#8A8A98",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <div
      className="text-[11px] font-bold tracking-[0.1em] uppercase"
      style={{ color }}
    >
      {children}
    </div>
  );
}
