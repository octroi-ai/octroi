"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmail } from "../../../lib/auth";
import { AUTH_CONFIGURED } from "../../../lib/auth-config";

// No real auth backend (public demo) → the login enters the live demo directly.
const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
const OPEN_ACCESS = DEMO || !AUTH_CONFIGURED;

function Mark() {
  return (
    <svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#0A0D0B" stroke="#1F271D" />
      <path d="M15 49 L49 49 L49 15 Z" fill="#C6F24E" />
      <rect x="20" y="20" width="3.5" height="29" rx="1.75" fill="#0A0D0B" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (OPEN_ACCESS) {
      router.push("/dashboard");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Identifiants invalides");
    } finally {
      setLoading(false);
    }
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
              AI control plane
            </div>
          </div>
        </Link>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-2xl">
          <div className="mb-1 flex items-center justify-between">
            <h1 className="text-base font-semibold">Connexion</h1>
            {OPEN_ACCESS && (
              <span className="rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-primary)]">
                démo
              </span>
            )}
          </div>
          <p className="mb-6 text-xs text-[var(--color-muted-foreground)]">
            {OPEN_ACCESS
              ? "Accès libre à la démonstration — aucune donnée requise."
              : "Accédez à votre plan de contrôle IA."}
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 p-3 text-sm text-[var(--color-destructive)]">
              {error}
            </div>
          )}

          {OPEN_ACCESS ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-2 w-full rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90"
            >
              Entrer dans la démo →
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.com" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Mot de passe</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className={inputCls} />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[var(--color-muted-foreground)]">
            Pas de compte ?{" "}
            <Link href="/register" className="text-[var(--color-primary)] hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
