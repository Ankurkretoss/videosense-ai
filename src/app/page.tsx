"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Menu, Play, X } from "lucide-react";
import {
  Chip,
  ComingSoonBadge,
  Eyebrow,
  GhostLink,
  Panel,
  PrimaryLink,
  StatusPill,
  Tag,
} from "@/components/vantage/ui";
import {
  FAQS,
  FEATURES,
  FOOTER_COLUMNS,
  HERO_STATS,
  PLANS,
  SPORTS,
  STEPS,
  VALUE_BAR,
} from "@/lib/vantage-content";
import { LiveAnalysisPreview } from "@/components/vantage/LiveAnalysisPreview";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  ["Sports", "#sports"],
  ["How it works", "#how"],
  ["Features", "#features"],
  ["Match report", "#report"],
  ["Pricing", "#pricing"],
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="page-glow relative min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-white/[0.09] bg-ink/[0.78] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-6 px-5 py-4 sm:px-10">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="brand-gradient grid h-[26px] w-[26px] place-items-center rounded-lg">
                <div className="h-2 w-2 rounded-sm bg-white" />
              </div>
              <span className="text-[16px] font-extrabold tracking-[-0.02em]">
                Vantage<span className="text-[#9B82FF]">AI</span>
              </span>
            </Link>
            <div className="hidden items-center gap-6 text-[13.5px] font-medium text-mute xl:flex">
              {NAV_LINKS.map(([label, href]) => (
                <a key={href} href={href} className="transition-colors hover:text-ink-200">
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="text-[13.5px] font-semibold text-ink-300 transition-colors hover:text-white max-sm:hidden"
            >
              Log in
            </Link>
            <PrimaryLink href="/auth" className="px-4 py-2.5 text-[13px]">
              Start free analysis
            </PrimaryLink>
            <button
              type="button"
              onClick={() => setNavOpen((open) => !open)}
              className="rounded-[9px] border border-white/[0.11] bg-panel-2 p-2 text-mute xl:hidden"
              aria-label="Toggle navigation"
            >
              {navOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {navOpen && (
          <div className="border-t border-white/[0.09] bg-ink px-5 py-4 xl:hidden">
            <div className="flex flex-col gap-3 text-[14px] text-mute">
              {NAV_LINKS.map(([label, href]) => (
                <a key={href} href={href} onClick={() => setNavOpen(false)}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1480px] items-center gap-12 px-5 pt-16 pb-24 sm:px-10 lg:grid-cols-[minmax(360px,0.85fr)_minmax(420px,1.15fr)] xl:gap-14 xl:pr-14 xl:pl-14">
        <div>
          <div className="font-mono-num inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 py-1.5 pr-3 pl-2 text-[12px] font-semibold text-brand-soft">
            <span
              className="h-1.5 w-1.5 rounded-full bg-good"
              style={{ animation: "vpulse 2s infinite" }}
            />
            Football live · 132 events detected per match avg.
          </div>
          <h1 className="mt-5 text-[38px] leading-[1.03] font-extrabold tracking-[-0.035em] text-balance sm:text-[46px] lg:text-[58px]">
            Turn every match into actionable intelligence.
          </h1>
          <p className="mt-5 max-w-[560px] text-[17.5px] leading-[1.55] text-mute">
            Upload the game. AI understands the game — every player, movement, event and decision
            becomes player insight, tactical intelligence and highlight clips.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryLink href="/auth" className="px-6 py-3.5 text-[14.5px]">
              Start free analysis
            </PrimaryLink>
            <GhostLink href="#how" className="px-6 py-3.5 text-[14.5px]">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/[0.12]">
                <Play className="h-2.5 w-2.5" />
              </span>
              Watch how it works
            </GhostLink>
            <a
              href="#sports"
              className="inline-flex items-center gap-1.5 px-2 py-3.5 text-[14.5px] font-semibold text-brand-soft"
            >
              Explore sports
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-7 border-t border-white/10 pt-7">
            {HERO_STATS.map((stat) => (
              <div key={stat.k}>
                <div className="font-mono-num text-[22px] font-semibold text-ink-100">{stat.v}</div>
                <div className="mt-1 text-[12.5px] text-mute-3">{stat.k}</div>
              </div>
            ))}
          </div>
        </div>

        <LiveAnalysisPreview />
      </section>

      {/* Value bar */}
      <section className="border-y border-white/[0.09] bg-white/[0.014]">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-x-8 gap-y-3.5 px-5 py-8 sm:px-10">
          <div className="text-[13.5px] font-semibold text-mute-2">
            Built for coaches, analysts, scouts and performance teams.
          </div>
          <div className="flex flex-wrap gap-2.5">
            {VALUE_BAR.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.11] bg-panel-3 px-3.5 py-2 text-[12.5px] font-semibold text-ink-400"
              >
                <span className="h-[5px] w-[5px] rounded-full bg-brand" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Sports */}
      <section id="sports" className="mx-auto max-w-[1480px] px-5 py-20 sm:px-10">
        <Eyebrow>Sports</Eyebrow>
        <h2 className="mt-3 max-w-[760px] text-[32px] leading-tight font-extrabold tracking-[-0.03em] sm:text-[40px]">
          Football today, more sports on the way.
        </h2>
        <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-mute">
          The engine is built so each sport brings its own event model and maps. Football is fully
          covered end to end — the rest are in development.
        </p>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SPORTS.map((sport) => (
            <Panel
              key={sport.name}
              className={cn(
                "p-5 transition-colors",
                sport.available ? "border-brand/40 bg-brand/[0.06]" : "opacity-80"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono-num rounded-md border border-white/[0.11] bg-ink-600 px-2 py-1 text-[11px] text-brand-soft">
                    {sport.abbr}
                  </span>
                  <span className="text-[16px] font-bold">{sport.name}</span>
                </div>
                {sport.available ? <StatusPill tone="good">Live</StatusPill> : <ComingSoonBadge />}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-mute">{sport.model}</p>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {sport.metrics.map((metric) => (
                  <Tag key={metric}>{metric}</Tag>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.09] pt-3.5">
                <span className="font-mono-num text-[11.5px] text-mute-3">{sport.maps}</span>
                {sport.available ? (
                  <Link
                    href="/auth"
                    className="text-[12.5px] font-bold text-brand-soft hover:text-brand-pale"
                  >
                    Analyse a match →
                  </Link>
                ) : (
                  <span className="text-[12.5px] text-mute-4">In development</span>
                )}
              </div>
            </Panel>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-white/[0.09] bg-ink-700/40">
        <div className="mx-auto max-w-[1480px] px-5 py-20 sm:px-10">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 max-w-[760px] text-[32px] leading-tight font-extrabold tracking-[-0.03em] sm:text-[40px]">
            Upload once. Everything else is automatic.
          </h2>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step) => (
              <Panel key={step.n} className="flex flex-col p-5">
                <span className="font-mono-num text-[12px] text-brand">{step.n}</span>
                <h3 className="mt-3 text-[17px] font-bold">{step.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-mute">{step.body}</p>
                <ul className="mt-4 space-y-2 border-t border-white/[0.09] pt-3.5">
                  {step.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[12.5px] text-ink-400">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-[1480px] px-5 py-20 sm:px-10">
        <Eyebrow>Features</Eyebrow>
        <h2 className="mt-3 max-w-[760px] text-[32px] leading-tight font-extrabold tracking-[-0.03em] sm:text-[40px]">
          A full analyst&apos;s toolkit from one video.
        </h2>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature) => (
            <Panel key={feature.i} className="p-5">
              <span className="font-mono-num text-[12px] text-brand">{feature.i}</span>
              <h3 className="mt-3 text-[17px] font-bold">{feature.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-mute">{feature.body}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {feature.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      </section>

      {/* Match report */}
      <section id="report" className="border-y border-white/[0.09] bg-ink-700/40">
        <div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-20 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <Eyebrow>Match report</Eyebrow>
            <h2 className="mt-3 text-[32px] leading-tight font-extrabold tracking-[-0.03em] sm:text-[40px]">
              Structured intelligence, not a video dump.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-mute">
              Overview, players, event log, tactics, pitch maps and clips — each number traceable to
              a timestamp in your footage, with the uncertain ones flagged.
            </p>
            <div className="mt-6 flex flex-wrap gap-1.5">
              {[
                "Match overview",
                "Key moments",
                "Team performance",
                "Player performance",
                "Tactical analysis",
                "Strengths",
                "Weaknesses",
                "Recommendations",
              ].map((item) => (
                <Chip key={item} className="cursor-default">
                  {item}
                </Chip>
              ))}
            </div>
            <PrimaryLink href="/auth" className="mt-7">
              Generate your first report
            </PrimaryLink>
          </div>

          <Panel className="p-5">
            <div className="space-y-3">
              {[
                { t: "04:12", type: "Goal", detail: "#4 A. Trusty · header, 0.31 xG", tone: "good" },
                { t: "05:24", type: "Goal", detail: "#21 C. Duran · counter-attack", tone: "good" },
                { t: "09:18", type: "Shot on target", detail: "#11 · saved low left", tone: "brand" },
                { t: "22:41", type: "Tactical moment", detail: "Overload on the left wing", tone: "warn" },
                { t: "44:06", type: "Yellow card", detail: "#6 · tactical foul", tone: "bad" },
              ].map((event) => (
                <div
                  key={event.t}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.09] bg-ink-500 px-3.5 py-3"
                >
                  <span className="font-mono-num text-[12.5px] text-brand-soft">{event.t}</span>
                  <StatusPill tone={event.tone as "good" | "brand" | "warn" | "bad"}>
                    {event.type}
                  </StatusPill>
                  <span className="truncate text-[13px] text-mute">{event.detail}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-[1480px] px-5 py-20 sm:px-10">
        <Eyebrow>Pricing</Eyebrow>
        <h2 className="mt-3 text-[32px] leading-tight font-extrabold tracking-[-0.03em] sm:text-[40px]">
          Plans for coaches, clubs and federations.
        </h2>
        <p className="mt-3 text-[14px] text-mute">
          Prices are placeholders while the platform is in development.
        </p>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <Panel
              key={plan.name}
              className={cn(
                "flex flex-col p-5",
                plan.featured &&
                  "border-brand/40 bg-gradient-to-b from-brand/10 to-brand/[0.02]"
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-bold">{plan.name}</h3>
                {plan.badge && <StatusPill tone="brand">{plan.badge}</StatusPill>}
              </div>
              <div className="font-mono-num mt-4 text-[28px]">{plan.price}</div>
              <div className="mt-1 text-[12px] text-mute-3">{plan.per}</div>
              <ul className="mt-4 flex-1 space-y-2 border-t border-white/[0.09] pt-3.5">
                {plan.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[12.5px] text-ink-400">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
              {plan.featured ? (
                <PrimaryLink href="/auth" className="mt-5 w-full">
                  {plan.cta}
                </PrimaryLink>
              ) : (
                <GhostLink href="/auth" className="mt-5 w-full">
                  {plan.cta}
                </GhostLink>
              )}
            </Panel>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/[0.09] bg-ink-700/40">
        <div className="mx-auto max-w-[900px] px-5 py-20 sm:px-10">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-3 text-[32px] leading-tight font-extrabold tracking-[-0.03em]">
            Questions, answered.
          </h2>

          <div className="mt-8 space-y-2.5">
            {FAQS.map(([question, answer], index) => {
              const open = openFaq === index;
              return (
                <Panel key={question} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                  >
                    <span className="text-[14.5px] font-bold">{question}</span>
                    <span className="font-mono-num text-[16px] text-brand-soft">
                      {open ? "−" : "+"}
                    </span>
                  </button>
                  {open && (
                    <p className="border-t border-white/[0.09] px-4 py-4 text-[13.5px] leading-relaxed text-mute">
                      {answer}
                    </p>
                  )}
                </Panel>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA + footer */}
      <footer className="border-t border-white/[0.09]">
        <div className="mx-auto max-w-[1480px] px-5 py-16 sm:px-10">
          <Panel className="brand-gradient border-0 p-8 text-center">
            <h2 className="text-[26px] font-extrabold tracking-[-0.03em] text-white sm:text-[32px]">
              Analyse your next football match tonight.
            </h2>
            <p className="mx-auto mt-3 max-w-[520px] text-[14.5px] text-white/85">
              Upload the footage and get events, players, tactics and clips back — no manual tagging.
            </p>
            <Link
              href="/auth"
              className="mt-6 inline-flex items-center gap-2 rounded-[11px] bg-ink px-6 py-3.5 text-[14px] font-bold text-white hover:bg-ink-700"
            >
              Start free analysis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Panel>

          <div className="mt-12 grid gap-8 border-t border-white/[0.09] pt-10 sm:grid-cols-2 xl:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="brand-gradient h-6 w-6 rounded-[7px]" />
                <span className="text-[15px] font-extrabold">
                  Vantage<span className="text-[#9B82FF]">AI</span>
                </span>
              </div>
              <p className="mt-3 max-w-[280px] text-[12.5px] leading-relaxed text-mute-3">
                AI match analysis for coaches, analysts and scouts. Football first, more sports in
                development.
              </p>
            </div>
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <div className="text-[12px] font-bold tracking-[0.08em] text-ink-400 uppercase">
                  {column.title}
                </div>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link} className="text-[12.5px] text-mute-3">
                      {link}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.09] pt-6 text-[12px] text-mute-4">
            <span>© {new Date().getFullYear()} VantageAI. All rights reserved.</span>
            <span className="font-mono-num">Football analysis · in development</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
