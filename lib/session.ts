import type { AdminUser } from "@/types/api";

// Same keys the app has always used, so pages that read them directly keep working
const TOKEN_KEY = "adminToken";
const USER_KEY = "adminUser";
const EXPIRES_KEY = "adminExpiresAt";

/** Fired when the server rejects the token, so the layout can send you to the login page. */
export const SESSION_EXPIRED_EVENT = "admin:session-expired";

const canUseStorage = () => typeof window !== "undefined";

export function getToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AdminUser | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

/** True when a token is stored and its expiry (if known) hasn't passed. */
export function hasActiveSession(): boolean {
  if (!canUseStorage()) return false;
  if (!localStorage.getItem(TOKEN_KEY) || !getUser()) return false;

  const expiresAt = localStorage.getItem(EXPIRES_KEY);
  return !expiresAt || Date.parse(expiresAt) > Date.now();
}

export function saveSession(session: {
  token: string;
  user: AdminUser;
  expiresAt?: string;
}) {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  if (session.expiresAt) localStorage.setItem(EXPIRES_KEY, session.expiresAt);
  else localStorage.removeItem(EXPIRES_KEY);
}

export function clearSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

/** Clears the session and tells the app it ended (token expired, revoked, or rejected). */
export function expireSession() {
  clearSession();
  if (canUseStorage()) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
