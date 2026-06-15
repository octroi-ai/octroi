"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { OverviewCharts } from "@/components/charts/overview-charts";
import { useApi, apiClient } from "@/lib/use-api";

interface UsageRow {
  date: string;
  provider: string;
  model: string;
  total_tokens: number;
  total_cost: number;
  avg_latency: number;
  cache_hits: number;
  request_count: number;
}

interface Savings {
  actual_cost: number;
  cache_savings: number;
  total_requests: number;
  cached_requests: number;
  avg_latency: number;
}

const LANES = [
  { label: "openai → us-east-1", color: "var(--color-flux-cyan)", top: "16%", dur: 4.0, delay: 0 },
  { label: "claude → eu-west-3", color: "var(--color-primary)", top: "44%", dur: 5.0, delay: 1.2 },
  { label: "fallback → self-host", color: "var(--color-flux-coral)", top: "72%", dur: 4.6, delay: 2.1 },
];

function LiveGate() {
  const t = useTranslations();
  const [reqs, setReqs] = useState(2418902);
  useEffect(() => {
    const id = setInterval(() => setReqs((r) => r + Math.floor(Math.random() * 6) + 1), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="flex items-center gap-1.5 text-primary">
          <span className="blink inline-block h-1.5 w-1.5 rounded-full bg-primary" /> {t("Gate.live")}
        </span>
        <span className="tabular-nums text-foreground">
          {reqs.toLocaleString()} <span className="text-muted-foreground">{t("Dashboard.through")}</span>
        </span>
      </div>
      <div className="relative h-28">
        <div className="absolute bottom-0 top-0 left-[55%] w-px bg-primary/50" style={{ boxShadow: "0 0 18px var(--color-primary)" }} />
        <div className="absolute left-[55%] top-2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.2em] text-primary">octroi</div>
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
    </div>
  );
}

const fmtUsd = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function DashboardPage() {
  const t = useTranslations("Dashboard");

  const fetchUsage = useCallback(() => apiClient.analytics.getUsage(), []);
  const fetchSavings = useCallback(() => apiClient.analytics.getSavings(), []);
  const fetchEsg = useCallback(() => apiClient.esg.getFootprint(), []);
  const fetchCompliance = useCallback(() => apiClient.compliance.getStatus(), []);

  const usage = useApi<{ data: UsageRow[]; period: { from: string; to: string } }>(fetchUsage);
  const savings = useApi<{ savings: Savings; period: { from: string; to: string } }>(fetchSavings);
  const esg = useApi<{ footprint: { co2_kg: number }; period: any }>(fetchEsg);
  const compliance = useApi<{ score: number; total_systems: number }>(fetchCompliance);

  const totalCost = usage.data?.data.reduce((sum, row) => sum + Number(row.total_cost), 0) ?? 0;
  const totalTokens = usage.data?.data.reduce((sum, row) => sum + Number(row.total_tokens), 0) ?? 0;
  const avgLatency = savings.data?.savings.avg_latency ?? 0;
  const cacheHitRate = savings.data?.savings.total_requests
    ? (savings.data.savings.cached_requests / savings.data.savings.total_requests) * 100
    : 0;
  const complianceScore = compliance.data?.score ?? 0;
  const cacheSavings = savings.data?.savings.cache_savings ?? 0;
  const isLoading = usage.loading || savings.loading;

  const readouts = [
    { label: t("cost"), value: isLoading ? "—" : fmtUsd(totalCost), accent: "var(--color-primary)" },
    { label: t("tokens"), value: isLoading ? "—" : `${(totalTokens / 1_000_000).toFixed(1)}M`, accent: "var(--color-foreground)" },
    { label: t("latency"), value: isLoading ? "—" : `${Math.round(avgLatency)} ms`, accent: "var(--color-foreground)" },
    { label: t("cache"), value: isLoading ? "—" : `${cacheHitRate.toFixed(1)}%`, accent: "var(--color-flux-cyan)" },
    { label: t("savings"), value: isLoading ? "—" : fmtUsd(cacheSavings), accent: "var(--color-primary)" },
    { label: t("compliance"), value: compliance.loading ? "—" : `${complianceScore}/100`, accent: "var(--color-flux-amber)" },
  ];

  return (
    <>
      <Header eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
        {readouts.map((r) => (
          <div key={r.label} className="bg-card p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{r.label}</div>
            <div className="mt-2 font-mono text-xl font-semibold tabular-nums" style={{ color: r.accent }}>{r.value}</div>
          </div>
        ))}
      </div>

      <LiveGate />

      <div className="mt-6">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("flux30")}</div>
        <OverviewCharts usageData={usage.data?.data ?? []} />
      </div>
    </>
  );
}
