"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Menu, Plus, Search, X } from "lucide-react";
import { DASHBOARD_NAV } from "@/lib/vantage-content";
import { endSession, initials, readSession, type SessionUser } from "@/lib/session";
import { ComingSoonBadge } from "@/components/vantage/ui";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    // Deferred so reading localStorage does not setState inside the effect body.
    const timer = setTimeout(() => setUser(readSession()), 0);
    return () => clearTimeout(timer);
  }, []);

  const logout = () => {
    endSession();
    router.push("/");
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const navList = (
    <div className="flex flex-col gap-0.5">
      {DASHBOARD_NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setNavOpen(false)}
            className={cn(
              "flex items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-[13.5px] font-semibold transition-colors",
              active
                ? "bg-brand/[0.14] text-brand-pale"
                : "text-mute hover:bg-white/[0.04] hover:text-ink-200"
            )}
          >
            <span
              className={cn(
                "h-[5px] w-[5px] shrink-0 rounded-full",
                active ? "bg-brand" : "bg-white/[0.18]"
              )}
            />
            <span className="truncate">{item.label}</span>
            {!item.available && <ComingSoonBadge short className="ml-auto" />}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="grid min-h-screen lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4 border-r border-white/10 bg-ink-700 p-3.5 max-lg:hidden">
        <Link href="/" className="flex items-center gap-2.5 px-2 py-1">
          <div className="brand-gradient h-6 w-6 rounded-[7px]" />
          <span className="text-[15px] font-extrabold">
            Vantage<span className="text-[#9B82FF]">AI</span>
          </span>
        </Link>

        <Link
          href="/dashboard/new"
          className="brand-gradient flex items-center justify-center gap-1.5 rounded-[10px] px-3.5 py-2.5 text-[13px] font-bold whitespace-nowrap text-white hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" />
          New match analysis
        </Link>

        {navList}

        <div className="mt-auto rounded-xl border border-white/10 bg-panel-2 p-3.5">
          <div className="text-[12px] font-bold text-ink-400">Pro plan</div>
          <div className="mt-1 text-[11.5px] text-mute-3">Placeholder billing — no limits applied</div>
          <div className="mt-2.5 h-[5px] overflow-hidden rounded-[3px] bg-white/10">
            <div className="h-full w-[45%] bg-gradient-to-r from-[#6B49FF] to-[#A78BFA]" />
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-ink-700/[0.86] px-4 py-3.5 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-[9px] border border-white/[0.11] bg-panel-2 p-2 text-mute lg:hidden"
            onClick={() => setNavOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            {navOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <div className="flex max-w-[420px] flex-1 items-center gap-2 rounded-[10px] border border-white/[0.11] bg-ink-600 px-3 py-2.5 text-[13px] text-mute-4 max-sm:hidden">
            <Search className="h-3.5 w-3.5" />
            Search matches, players, clips…
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono-num rounded-lg border border-brand/[0.28] bg-brand/10 px-2.5 py-1.5 text-[12px] text-brand-soft max-sm:hidden">
              Football only
            </span>
            <span className="relative grid h-8 w-8 place-items-center rounded-[9px] border border-white/[0.11] bg-panel-2 text-mute">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-bad" />
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2.5 rounded-full border border-white/[0.11] bg-panel-2 py-1 pr-3 pl-1 text-ink-100"
              >
                <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-brand/20 text-[11px] font-bold text-brand-soft">
                  {initials(user?.name ?? "Guest Coach")}
                </span>
                <span className="text-[12.5px] font-semibold max-sm:hidden">
                  {user?.name ?? "Guest Coach"}
                </span>
                <ChevronDown className="h-3 w-3 text-mute-2" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-11 z-60 w-52 rounded-xl border border-white/10 bg-panel-2 p-2 shadow-[0_20px_48px_rgba(0,0,0,0.65)]">
                  <div className="border-b border-white/10 px-2.5 pt-2 pb-2.5">
                    <div className="text-[13px] font-bold">{user?.name ?? "Guest Coach"}</div>
                    <div className="mt-0.5 text-[11.5px] text-mute-3">
                      {user?.role ?? "Analyst"} · {user?.org ?? "Independent"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1.5 w-full rounded-lg px-2.5 py-2.5 text-left text-[13px] font-semibold text-bad hover:bg-bad/10"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {navOpen && (
          <div className="border-b border-white/10 bg-ink-700 p-3.5 lg:hidden">{navList}</div>
        )}

        {children}
      </main>
    </div>
  );
}
