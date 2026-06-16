"use client";

// The "session" is the org API key, stored in a cookie. The browser sends it to
// the proxy as X-Octroi-Key; middleware gates protected routes on its presence.
// No Supabase, no anon key — fully self-contained.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const PROXY_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export const SESSION_COOKIE = "octroi_key";
export const EMAIL_COOKIE = "octroi_email";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string, days = 30) {
  const exp = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${exp}; SameSite=Lax`;
}

function delCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function getApiKey() {
  return getCookie(SESSION_COOKIE);
}
export function getEmail() {
  return getCookie(EMAIL_COOKIE);
}

function saveSession(apiKey: string, email: string) {
  setCookie(SESSION_COOKIE, apiKey);
  setCookie(EMAIL_COOKIE, email);
}

export async function registerAccount(email: string, password: string, orgName?: string) {
  const res = await fetch(`${PROXY_ORIGIN}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, orgName }),
  });
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(data.error || "Inscription impossible.");
  saveSession(data.apiKey, data.email);
  return data;
}

export async function loginAccount(email: string, password: string) {
  const res = await fetch(`${PROXY_ORIGIN}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(data.error || "Connexion impossible.");
  saveSession(data.apiKey, data.email);
  return data;
}

export function enterDemo() {
  const demoKey = process.env.NEXT_PUBLIC_DEV_API_KEY || "octroi_demo_key";
  saveSession(demoKey, "demo@octroi.ai");
}

export function logout() {
  delCookie(SESSION_COOKIE);
  delCookie(EMAIL_COOKIE);
}
