"use client";

/**
 * The animated hero visual: a tracked pitch with player markers, a moving ball,
 * heat blobs, a detection badge, an event timeline and floating insight cards.
 * Ported from the VantageAI design, driven by CSS keyframes only.
 */

const CHIP_A = "rgba(107,73,255,0.9)";
const CHIP_B = "rgba(248,113,113,0.9)";

const TRACKED_PLAYERS = [
  { num: "17", x: 30, y: 58, dur: 5.5, chip: CHIP_A, ring: "#6B49FF" },
  { num: "8", x: 46, y: 40, dur: 6.4, chip: CHIP_A, ring: "#6B49FF" },
  { num: "11", x: 62, y: 66, dur: 7.1, chip: CHIP_A, ring: "#6B49FF" },
  { num: "4", x: 71, y: 34, dur: 6.8, chip: CHIP_B, ring: "#F87171" },
  { num: "6", x: 55, y: 74, dur: 5.9, chip: CHIP_B, ring: "#F87171" },
  { num: "2", x: 80, y: 55, dur: 7.6, chip: CHIP_B, ring: "#F87171" },
];

const G = "#34D399";
const P = "#A78BFA";
const R = "#F87171";
const Y = "#FBBF24";
const B = "#60A5FA";

const TIMELINE_MARKS = [
  { at: 4, c: P },
  { at: 8, c: P },
  { at: 12, c: G },
  { at: 18, c: G },
  { at: 26, c: Y },
  { at: 33, c: P },
  { at: 41, c: G },
  { at: 55, c: B },
  { at: 62, c: R },
  { at: 74, c: G },
  { at: 88, c: P },
];

export function LiveAnalysisPreview() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-ink-600 shadow-[0_40px_100px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#1A1A21] px-3.5 py-2.5">
          <div className="font-mono-num flex min-w-0 items-center gap-2.5 text-[12px] text-mute">
            <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-bad" />
            <span className="truncate">LIVE ANALYSIS · celtic_v_dundee_utd.mp4</span>
          </div>
          <div className="font-mono-num shrink-0 text-[11px] text-brand-soft">AI confidence 94%</div>
        </div>

        <div
          className="relative aspect-[16/9]"
          style={{
            background: "repeating-linear-gradient(115deg, #14251A 0 14px, #101F16 14px 28px)",
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.7),rgba(0,0,0,0.05)_55%)]" />

          {/* Pitch markings */}
          <div className="absolute inset-y-[12%] inset-x-[8%] rounded border border-white/[0.16]" />
          <div className="absolute top-[12%] bottom-[12%] left-1/2 w-px bg-white/[0.14]" />
          <div className="absolute top-1/2 left-1/2 -mt-12 -ml-12 h-24 w-24 rounded-full border border-white/[0.13]" />
          <div className="absolute top-[30%] bottom-[30%] left-[8%] w-[8%] border border-white/[0.13]" />
          <div className="absolute top-[30%] bottom-[30%] right-[8%] w-[8%] border border-white/[0.13]" />

          {/* Heat blobs */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(90px 70px at 34% 62%, rgba(248,113,113,0.34), transparent 70%), radial-gradient(120px 90px at 62% 40%, rgba(139,107,255,0.32), transparent 70%), radial-gradient(80px 60px at 78% 66%, rgba(251,191,36,0.22), transparent 70%)",
            }}
          />

          {/* Tracked players */}
          {TRACKED_PLAYERS.map((player) => (
            <div
              key={player.num}
              className="absolute"
              style={{
                left: `${player.x}%`,
                top: `${player.y}%`,
                animation: `vtrack ${player.dur}s ease-in-out infinite`,
              }}
            >
              <div
                className="h-3 w-[30px] rounded-[50%] opacity-50 blur-[1px]"
                style={{ background: player.ring }}
              />
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-[3px]">
                <div
                  className="font-mono-num rounded px-[5px] py-px text-[10px] font-semibold text-white"
                  style={{ background: player.chip }}
                >
                  {player.num}
                </div>
                <div className="h-2.5 w-[2px]" style={{ background: player.chip }} />
              </div>
            </div>
          ))}

          {/* Ball */}
          <div
            className="absolute left-[52%] top-[47%]"
            style={{ animation: "vball 5s ease-in-out infinite" }}
          >
            <div className="h-[9px] w-[9px] rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.18),0_0_16px_rgba(255,255,255,0.6)]" />
          </div>

          {/* Detection badge */}
          <div className="font-mono-num absolute top-3 right-3 inline-flex items-center gap-2 rounded-lg border border-brand/40 bg-ink/[0.78] px-2.5 py-1.5 text-[11px] text-brand-soft">
            <span
              className="h-[5px] w-[5px] rounded-full bg-brand"
              style={{ animation: "vpulse 1.6s infinite" }}
            />
            <span className="max-sm:hidden">DETECTING · 22 players · ball · 2 teams</span>
            <span className="sm:hidden">DETECTING · 22 players</span>
          </div>

          {/* Playback + event timeline */}
          <div className="absolute inset-x-0 bottom-0 px-4 pt-3.5 pb-4">
            <div className="font-mono-num flex items-center gap-3 text-[11px] text-ink-400">
              <span>04:12</span>
              <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/[0.16]">
                <div className="absolute inset-y-0 left-0 right-[62%] rounded-full bg-gradient-to-r from-[#6B49FF] to-[#A78BFA]" />
              </div>
              <span>90:00</span>
            </div>
            <div className="relative mt-2 h-4">
              {TIMELINE_MARKS.map((mark) => (
                <div
                  key={`${mark.at}-${mark.c}`}
                  className="absolute top-[3px] h-2.5 w-[2px] rounded-sm"
                  style={{ left: `${mark.at}%`, background: mark.c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating insight cards — hidden on small screens where they would overlap */}
      <div className="pointer-events-none max-xl:hidden">
        <div
          className="absolute top-[16%] -left-[34px] rounded-xl border border-good/35 bg-panel-2/[0.96] px-3.5 py-[11px] shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
          style={{ animation: "vfloat 6s ease-in-out infinite" }}
        >
          <div className="text-[11px] font-bold tracking-[0.08em] text-good uppercase">
            Goal detected
          </div>
          <div className="mt-[3px] text-[13px] font-semibold text-[#E7E7EE]">
            04:12 · #17 Tounekti
          </div>
        </div>

        <div
          className="absolute top-[40%] -right-[30px] rounded-xl border border-brand/35 bg-panel-2/[0.96] px-3.5 py-[11px] shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
          style={{ animation: "vfloat 7.5s ease-in-out infinite" }}
        >
          <div className="text-[11px] font-bold tracking-[0.08em] text-[#B9A6FF] uppercase">
            Expected goals
          </div>
          <div className="font-mono-num mt-[3px] text-[15px] text-white">
            0.35 xG · shot detected
          </div>
        </div>

        <div
          className="absolute -bottom-[30px] left-[4%] rounded-xl border border-white/[0.12] bg-panel-2/[0.96] px-3.5 py-[11px] shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
          style={{ animation: "vfloat 6.8s ease-in-out infinite" }}
        >
          <div className="text-[11px] font-bold tracking-[0.08em] text-mute-2 uppercase">
            Tactical pattern
          </div>
          <div className="mt-[3px] text-[13px] font-semibold text-[#E7E7EE]">
            High pressing detected
          </div>
        </div>

        <div
          className="absolute -bottom-[26px] right-[6%] rounded-xl border border-info/35 bg-panel-2/[0.96] px-3.5 py-[11px] shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
          style={{ animation: "vfloat 8s ease-in-out infinite" }}
        >
          <div className="text-[11px] font-bold tracking-[0.08em] text-info uppercase">
            Highlights
          </div>
          <div className="mt-[3px] text-[13px] font-semibold text-[#E7E7EE]">
            12 clips generated
          </div>
        </div>
      </div>
    </div>
  );
}
