"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { registerAccount, enterDemo } from "../../../lib/session";

function Mark() {
  return (
    <svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#0A0D0B" stroke="#1F271D" />
      <path d="M15 49 L49 49 L49 15 Z" fill="#C6F24E" />
      <rect x="20" y="20" width="3.5" height="29" rx="1.75" fill="#0A0D0B" />
    </svg>
  );
}

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(t("passwordMinPlaceholder"));
      return;
    }
    setLoading(true);
    try {
      await registerAccount(email, password, orgName);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function demo() {
    enterDemo();
    router.push("/dashboard");
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] transition-colors";
  const labelCls = "font-mono text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)]";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 text-[var(--color-foreground)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <Mark />
          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-tight">Octroi</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
              {t("tagline")}
            </div>
          </div>
        </Link>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-2xl">
          <h1 className="mb-1 text-base font-semibold">{t("registerTitle")}</h1>
          <p className="mb-6 text-xs text-[var(--color-muted-foreground)]">{t("registerSubtitle")}</p>

          {error && (
            <div className="mb-4 rounded-lg border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 p-3 text-sm text-[var(--color-destructive)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>{t("orgName")}</label>
              <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder={t("orgPlaceholder")} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t("email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t("password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("passwordMinPlaceholder")} required minLength={8} className={inputCls} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? t("creating") : t("signUp")}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--color-border)]" /></div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--color-card)] px-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted-foreground)]">{t("or")}</span>
            </div>
          </div>

          <button
            onClick={demo}
            className="w-full rounded-lg border border-[var(--color-border)] py-2.5 text-sm font-medium transition-colors hover:border-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)]"
          >
            {t("viewDemo")} →
          </button>

          <p className="mt-6 text-center text-sm text-[var(--color-muted-foreground)]">
            {t("haveAccount")}{" "}
            <Link href="/login" className="text-[var(--color-primary)] hover:underline">
              {t("signInLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
