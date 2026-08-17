"use client";

import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { Eyebrow, GhostLink, Panel, PrimaryLink } from "@/components/vantage/ui";
import { COMING_SOON } from "@/lib/vantage-content";

export default function ComingSoonSection() {
  const params = useParams<{ section: string }>();
  const key = params?.section ?? "";
  const entry = COMING_SOON[key];

  if (!entry) notFound();

  return (
    <div className="grid min-h-[62vh] place-items-center px-4 pt-14 pb-24 sm:px-6">
      <Panel className="max-w-[560px] border-white/10 bg-transparent p-2 text-center">
        <div className="mx-auto grid h-[52px] w-[52px] place-items-center rounded-[15px] border border-brand/35 bg-brand/[0.14]">
          <span className="font-mono-num text-[13px] text-brand-soft">···</span>
        </div>
        <Eyebrow className="mt-5">Coming soon</Eyebrow>
        <h1 className="mt-3 text-[30px] font-extrabold tracking-[-0.03em]">{entry.title}</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-mute">{entry.blurb}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5 pb-4">
          <PrimaryLink href="/dashboard">Back to dashboard</PrimaryLink>
          <GhostLink href="/dashboard/matches">Open a match report</GhostLink>
        </div>
      </Panel>
    </div>
  );
}
