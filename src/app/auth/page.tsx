"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Field, GhostButton, PrimaryButton } from "@/components/vantage/ui";
import { AUTH_PROOF, ROLES } from "@/lib/vantage-content";
import { startSession } from "@/lib/session";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

function AuthContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    org: "",
  });
  const [role, setRole] = useState(ROLES[1]);

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    // Placeholder auth: whatever was typed becomes the local session.
    startSession({ ...form, role });
    router.push(next);
  };

  return (
    <div className="page-glow grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-[420px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] text-mute transition-colors hover:text-ink-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="mt-8 flex items-center gap-2.5">
            <div className="brand-gradient h-[26px] w-[26px] rounded-lg" />
            <span className="text-[16px] font-extrabold tracking-[-0.02em]">
              Vantage<span className="text-[#9B82FF]">AI</span>
            </span>
          </div>

          <h1 className="mt-8 mb-1.5 text-[30px] font-extrabold tracking-[-0.03em]">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-[13.5px] text-mute">
            Sign-in is a placeholder for now — any details will take you into the dashboard.
          </p>

          <div className="mt-6 mb-[22px] flex gap-1 rounded-[10px] border border-white/10 bg-panel-2 p-1">
            {(["login", "signup"] as Mode[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  "flex-1 rounded-lg py-[9px] text-[13px] font-semibold transition-colors",
                  mode === value
                    ? "brand-gradient text-white"
                    : "text-mute hover:text-ink-200"
                )}
              >
                {value === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <Field
                label="Full name"
                placeholder="Mikkel Sørensen"
                value={form.name}
                onChange={set("name")}
              />
            )}
            <Field
              label="Email"
              type="email"
              placeholder="coach@club.com"
              value={form.email}
              onChange={set("email")}
            />
            <Field
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={set("password")}
            />
            {mode === "signup" && (
              <>
                <Field
                  label="Organisation / team"
                  placeholder="Club, academy or federation"
                  value={form.org}
                  onChange={set("org")}
                />
                <div>
                  <div className="mb-2 text-[12px] font-semibold text-mute">Role</div>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setRole(item)}
                        className={cn(
                          "rounded-lg border px-[11px] py-[7px] text-[12px] font-semibold transition-colors",
                          role === item
                            ? "border-brand/50 bg-brand/[0.14] text-brand-pale"
                            : "border-white/[0.11] bg-panel-3 text-ink-400 hover:text-ink-200"
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {mode === "login" && (
              <div className="mt-1 flex items-center justify-between text-[12.5px] text-mute">
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded border border-white/20 bg-brand/25" />
                  Remember me
                </span>
                <span className="text-brand-soft">Forgot password?</span>
              </div>
            )}

            <PrimaryButton type="submit" className="mt-4 w-full py-3.5 text-[14px]">
              {mode === "login" ? "Log in" : "Create account"}
            </PrimaryButton>
            <GhostButton
              type="button"
              onClick={() => {
                startSession({ email: "coach@club.com", name: "Guest Coach", role });
                router.push(next);
              }}
              className="w-full py-3"
            >
              Continue as guest
            </GhostButton>
          </form>

          <p className="mt-5 text-[12px] text-mute-4">
            By continuing you agree to the Terms and Privacy Policy.
          </p>
        </div>
      </div>

      <div className="hatch-strong relative hidden place-items-center border-l border-white/10 p-12 lg:grid">
        <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_60%_30%,rgba(139,107,255,0.22),transparent_70%)]" />
        <div className="relative max-w-[420px]">
          <div className="font-mono-num text-[11.5px] tracking-[0.12em] text-brand-soft uppercase">
            Trusted workflow
          </div>
          <div className="my-3.5 mb-[22px] text-[26px] leading-[1.2] font-extrabold tracking-[-0.025em]">
            132 events, 22 players and 12 clips from one upload.
          </div>
          <div className="flex flex-col gap-2.5">
            {AUTH_PROOF.map((item) => (
              <div
                key={item.k}
                className="flex items-center gap-3 rounded-[11px] border border-white/[0.11] bg-panel-2/90 px-3.5 py-3"
              >
                <span className="font-mono-num text-[13px] text-brand-soft">{item.v}</span>
                <span className="text-[13px] text-ink-300">{item.k}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  // useSearchParams needs a boundary so the shell can still be prerendered.
  return (
    <Suspense fallback={<div className="page-glow min-h-screen" />}>
      <AuthContent />
    </Suspense>
  );
}
