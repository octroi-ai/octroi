"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

const LANES = [
  { label: "openai → us-east-1", color: "var(--color-flux-cyan)", top: "10%", dur: 4.2, delay: 0 },
  { label: "claude → eu-west-3", color: "var(--color-primary)", top: "27%", dur: 5.3, delay: 1.4 },
  { label: "gemini → asia-ne1", color: "var(--color-flux-amber)", top: "44%", dur: 3.9, delay: 0.7 },
  { label: "cache · hit −100%", color: "var(--color-muted-foreground)", top: "61%", dur: 4.7, delay: 2.2 },
  { label: "fallback → self-host", color: "var(--color-flux-coral)", top: "78%", dur: 5.6, delay: 1.9 },
];

const RAILS = [
  { n: "01", key: "meter", color: "var(--color-primary)" },
  { n: "02", key: "route", color: "var(--color-flux-cyan)" },
  { n: "03", key: "govern", color: "var(--color-flux-amber)" },
  { n: "04", key: "everywhere", color: "var(--color-foreground)" },
];

const TICKER = [
  "req_8f2a  openai→us-east-1  1.2k tok  0.004$",
  "claude→eu-west-3  840 tok",
  "cache·hit  −100%",
  "anthropic↓ → fallback self-host  ·  0 downtime",
  "gemini→asia-ne1  2.1k tok",
  "policy ‘residency:eu’ applied",
  "system ‘credit-scoring’ → HIGH RISK",
  "ai registry updated · 142 systems",
];

function StatusDot({ color }: { color: string }) {
  return <span className="blink inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />;
}

export default function HomePage() {
  const t = useTranslations();
  const [count, setCount] = useState(2418902);
  const [saved, setSaved] = useState(198400);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 7) + 1);
      setSaved((s) => s + Math.floor(Math.random() * 38));
    }, 850);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Status bar ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-primary">◢</span>
            <span className="font-semibold tracking-[0.24em] text-foreground">OCTROI</span>
            <span className="hidden text-muted-foreground/70 lg:inline">// control plane</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/login" className="text-foreground transition-colors hover:text-primary">{t("Nav.login")}</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section id="flux" className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-5 pb-16 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <div
            className="pointer-events-none absolute -top-32 right-0 h-[520px] w-[520px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(198,242,78,0.10), transparent 70%)" }}
          />

          {/* Left — statement */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <StatusDot color="var(--color-primary)" /> {t("Hero.eyebrow")}
            </div>

            <h1 className="mt-6 font-sans font-extrabold leading-[0.92] tracking-tight" style={{ fontSize: "clamp(2.6rem, 6vw, 5.2rem)" }}>
              {t("Hero.title1")}
              <br />
              <span className="text-primary">{t("Hero.title2")}</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              {t("Hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-md bg-primary px-5 py-3 font-mono text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:brightness-110">
                {t("Hero.ctaPrimary")}
              </Link>
              <Link href="#porte" className="rounded-md border border-border px-5 py-3 font-mono text-sm uppercase tracking-wider transition hover:bg-card">
                {t("Hero.ctaSecondary")}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>{t("Hero.tag1")}</span><span className="text-border">/</span>
              <span>{t("Hero.tag2")}</span><span className="text-border">/</span>
              <span>{t("Hero.tag3")}</span>
            </div>
          </div>

          {/* Right — the living gate */}
          <div id="porte" className="relative overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="flex items-center gap-1.5 text-primary"><StatusDot color="var(--color-primary)" /> {t("Gate.live")}</span>
              <span>{t("Gate.region")}</span>
            </div>

            <div className="relative h-[300px]">
              <div className="absolute bottom-0 top-0 left-[58%] w-px bg-primary/50" style={{ boxShadow: "0 0 22px var(--color-primary)" }} />
              <div className="absolute left-[58%] top-2.5 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.2em] text-primary">octroi</div>

              {LANES.map((lane, i) => (
                <div
                  key={i}
                  className="absolute flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px]"
                  style={{
                    top: lane.top,
                    color: lane.color,
                    borderColor: "color-mix(in srgb, " + lane.color + " 45%, transparent)",
                    background: "rgba(10,13,11,0.7)",
                    animation: `flux-flow ${lane.dur}s linear ${lane.delay}s infinite`,
                  }}
                >
                  <span className="inline-block h-1 w-1 rounded-full" style={{ background: lane.color }} />
                  {lane.label}
                </div>
              ))}
            </div>

            <div className="border-t border-border p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t("Gate.traversed")}</div>
              <div className="mt-1 font-mono text-4xl font-semibold tabular-nums text-primary">
                {count.toLocaleString()}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted-foreground">
                <span><span className="text-foreground">{saved.toLocaleString()} $</span> {t("Gate.saved")}</span>
                <span className="text-primary">{t("Gate.savings")}</span>
                <span>{t("Gate.fallback")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Ticker ── */}
        <div className="overflow-hidden border-y border-border bg-card py-2.5">
          <div className="flex w-max gap-10 whitespace-nowrap pr-10 font-mono text-[11px] text-muted-foreground" style={{ animation: "ticker 32s linear infinite" }}>
            {[...TICKER, ...TICKER].map((tk, i) => (
              <span key={i} className="flex items-center gap-2"><span className="text-primary">▍</span>{tk}</span>
            ))}
          </div>
        </div>

        {/* ── Rails ── */}
        <section className="mx-auto max-w-[1200px] px-5">
          <div className="flex items-baseline justify-between py-7 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>{t("Rails.heading")}</span>
            <span>{t("Rails.count")}</span>
          </div>
          {RAILS.map((r) => (
            <div
              key={r.n}
              className="group grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-2 border-t border-border py-7 transition-colors hover:bg-card sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <span className="font-mono text-sm text-muted-foreground transition-colors group-hover:text-primary">{r.n}</span>
              <div>
                <h3 className="font-sans text-2xl font-bold tracking-tight">{t(`Rails.${r.key}_t`)}</h3>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{t(`Rails.${r.key}_d`)}</p>
              </div>
              <span className="col-start-2 font-mono text-sm sm:col-start-3 sm:text-right" style={{ color: r.color }}>{t(`Rails.${r.key}_m`)}</span>
            </div>
          ))}
          <div className="border-t border-border" />
        </section>

        {/* ── Closing ── */}
        <section className="mx-auto max-w-[1200px] px-5 py-24 text-center">
          <h2 className="mx-auto max-w-3xl font-sans font-extrabold leading-[1.04] tracking-tight" style={{ fontSize: "clamp(1.9rem, 4vw, 3.3rem)" }}>
            {t("Closing.title1")}
            <br />
            <span className="text-primary">{t("Closing.title2")}</span>
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="rounded-md bg-primary px-6 py-3 font-mono text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:brightness-110">
              {t("Closing.ctaPrimary")}
            </Link>
            <Link href="/login" className="rounded-md border border-border px-6 py-3 font-mono text-sm uppercase tracking-wider transition hover:bg-card">
              {t("Closing.ctaSecondary")}
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:flex-row">
          <span><span className="text-foreground">OCTROI</span> · {t("Footer.tagline")}</span>
          <span>{t("Footer.meta")}</span>
        </div>
      </footer>
    </div>
  );
}
