"use client";

import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Primitives for the VantageAI look: near-black surfaces, hairline
 * borders, purple gradient accents and monospace numerals.
 * ------------------------------------------------------------------ */

export function Panel({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-white/[0.11] bg-panel",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  hint,
  action,
  className,
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold text-ink-100">{title}</h2>
        {hint && <p className="mt-1.5 text-[13px] leading-relaxed text-mute">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "font-mono-num text-[11.5px] tracking-[0.14em] text-brand uppercase",
        className
      )}
    >
      {children}
    </div>
  );
}

const buttonBase =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[11px] text-[13.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55";

export function PrimaryButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={cn(
        buttonBase,
        "brand-gradient px-5 py-3 text-white shadow-[0_10px_28px_rgba(107,73,255,0.35)] hover:brightness-110",
        className
      )}
      {...props}
    />
  );
}

export function GhostButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={cn(
        buttonBase,
        "border border-white/[0.14] bg-white/[0.03] px-5 py-3 font-semibold text-ink-200 hover:border-white/25 hover:bg-white/[0.06]",
        className
      )}
      {...props}
    />
  );
}

export function SoftButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={cn(
        buttonBase,
        "border border-brand/35 bg-brand/[0.12] px-5 py-2.5 text-brand-soft hover:bg-brand/20",
        className
      )}
      {...props}
    />
  );
}

export function PrimaryLink({
  className,
  children,
  href,
}: {
  className?: string;
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonBase,
        "brand-gradient px-5 py-3 text-white shadow-[0_10px_28px_rgba(107,73,255,0.35)] hover:brightness-110",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function GhostLink({
  className,
  children,
  href,
}: {
  className?: string;
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonBase,
        "border border-white/[0.14] bg-white/[0.03] px-5 py-3 font-semibold text-ink-200 hover:border-white/25",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Chip({
  children,
  active,
  tone = "default",
  className,
  ...props
}: ComponentProps<"button"> & { active?: boolean; tone?: "default" | "brand" }) {
  return (
    <button
      className={cn(
        "rounded-lg border px-3 py-[7px] text-[12px] font-semibold whitespace-nowrap transition-colors",
        active
          ? "border-brand/50 bg-brand/[0.14] text-brand-pale"
          : "border-white/[0.11] bg-panel-3 text-ink-400 hover:border-white/20 hover:text-ink-200",
        tone === "brand" && !active && "text-brand-soft",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-md border border-white/[0.11] bg-panel-3 px-2 py-1 text-[11.5px] font-semibold text-ink-400",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({
  children,
  tone = "brand",
  className,
}: {
  children: ReactNode;
  tone?: "brand" | "good" | "warn" | "bad";
  className?: string;
}) {
  const tones = {
    brand: "bg-brand/[0.18] text-brand-soft",
    good: "bg-good/[0.16] text-good",
    warn: "bg-warn/[0.16] text-warn",
    bad: "bg-bad/[0.16] text-bad",
  } as const;

  return (
    <span
      className={cn(
        "rounded-md px-2 py-1 text-[10.5px] font-bold tracking-[0.06em] uppercase",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Kpi({
  label,
  value,
  delta,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  className?: string;
}) {
  return (
    <Panel className={cn("p-[18px]", className)}>
      <div className="text-[11.5px] font-bold tracking-[0.08em] text-mute-3 uppercase">
        {label}
      </div>
      <div className="font-mono-num mt-2.5 text-[26px] text-ink-100">{value}</div>
      {delta && <div className="mt-1.5 text-[12px] text-good">{delta}</div>}
    </Panel>
  );
}

export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("h-[5px] overflow-hidden rounded-[3px] bg-white/10", className)}>
      <div
        className="h-full rounded-[3px] bg-gradient-to-r from-[#6B49FF] to-[#A78BFA] transition-[width]"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Field({
  label,
  hint,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-mute">{label}</span>
      <input
        className={cn(
          "w-full rounded-[10px] border border-white/[0.09] bg-ink-600 px-3.5 py-3 text-[13.5px] text-ink-100 outline-none transition-colors placeholder:text-mute-4 focus:border-brand/60",
          className
        )}
        {...props}
      />
      {hint && <span className="mt-1.5 block text-[11.5px] text-mute-3">{hint}</span>}
    </label>
  );
}

export function ComingSoonBadge({
  short,
  className,
}: {
  short?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-md border border-white/[0.11] bg-white/[0.04] px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.08em] whitespace-nowrap text-mute-2 uppercase",
        className
      )}
    >
      {short ? "Soon" : "Coming soon"}
    </span>
  );
}
