/**
 * Placeholder session handling.
 *
 * There is no real authentication yet: any details typed into the login or sign-up
 * form create a local session cookie so the dashboard becomes reachable. The cookie
 * is only a gate for navigation — it grants nothing and carries no secret.
 */

export const SESSION_COOKIE = "vantage_session";

export interface SessionUser {
  name: string;
  email: string;
  role: string;
  org: string;
}

const STORAGE_KEY = "vantage_user";

function fallbackName(email: string): string {
  const handle = email.split("@")[0] || "Coach";
  return handle
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function startSession(user: Partial<SessionUser>): SessionUser {
  const email = user.email?.trim() || "coach@club.com";
  const session: SessionUser = {
    name: user.name?.trim() || fallbackName(email),
    email,
    role: user.role?.trim() || "Analyst",
    org: user.org?.trim() || "Independent",
  };

  // 7 days is plenty for a placeholder session.
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function endSession(): void {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
