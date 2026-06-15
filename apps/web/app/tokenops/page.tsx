"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { useApi, apiClient } from "@/lib/use-api";

interface UsageRow {
  date: string;
  provider: string;
  model: string;
  total_tokens: number;
  total_cost: number;
  request_count: number;
  cache_hits: number;
}

const fmtUsd = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function TokenOpsPage() {
  const t = useTranslations("TokenOps");
  const fetchUsage = useCallback(() => apiClient.analytics.getUsage(), []);
  const { data, loading, error } = useApi<{ data: UsageRow[]; period: any }>(fetchUsage);

  const modelMap = new Map<string, { model: string; provider: string; tokens: number; cost: number; requests: number }>();
  for (const row of data?.data ?? []) {
    const key = row.model;
    const existing = modelMap.get(key) || { model: row.model, provider: row.provider, tokens: 0, cost: 0, requests: 0 };
    existing.tokens += Number(row.total_tokens);
    existing.cost += Number(row.total_cost);
    existing.requests += Number(row.request_count);
    modelMap.set(key, existing);
  }
  const models = Array.from(modelMap.values()).sort((a, b) => b.cost - a.cost);

  const totalRequests = (data?.data ?? []).reduce((s, r) => s + Number(r.request_count), 0);
  const totalCacheHits = (data?.data ?? []).reduce((s, r) => s + Number(r.cache_hits), 0);
  const cacheRate = totalRequests > 0 ? (totalCacheHits / totalRequests) * 100 : 0;

  const readouts = [
    { label: t("totalReq"), value: loading ? "—" : totalRequests.toLocaleString(), accent: "var(--color-foreground)" },
    { label: t("cachedReq"), value: loading ? "—" : totalCacheHits.toLocaleString(), accent: "var(--color-flux-cyan)" },
    { label: t("cacheRate"), value: loading ? "—" : `${cacheRate.toFixed(1)}%`, accent: "var(--color-primary)" },
  ];

  return (
    <>
      <Header eyebrow={t("eyebrow")} title={t("title")} description={t("desc")} />

      {error && (
        <div className="mb-6 border border-border border-l-2 bg-card p-4 font-mono text-sm" style={{ borderLeftColor: "var(--color-destructive)", color: "var(--color-destructive)" }}>
          {error}
        </div>
      )}

      {cacheRate < 10 && !loading && totalRequests > 0 && (
        <div className="mb-6 border border-border border-l-2 bg-card p-4 font-mono text-sm" style={{ borderLeftColor: "var(--color-flux-amber)", color: "var(--color-flux-amber)" }}>
          {t("warnCacheLow", { rate: cacheRate.toFixed(1) })}
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {readouts.map((r) => (
          <div key={r.label} className="bg-card p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{r.label}</div>
            <div className="mt-2 font-mono text-xl font-semibold tabular-nums" style={{ color: r.accent }}>{r.value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("byModel")}</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[t("model"), t("provider"), t("tokens"), t("cost"), t("requests")].map((h, i) => (
                  <th key={h} className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground ${i < 2 ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center font-mono text-sm text-muted-foreground">{t("loading")}</td></tr>
              ) : models.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center font-mono text-sm text-muted-foreground">{t("nodata")}</td></tr>
              ) : (
                models.map((m) => (
                  <tr key={m.model} className="border-b border-border last:border-0 transition-colors hover:bg-background/40">
                    <td className="px-4 py-3 font-mono text-sm">{m.model}</td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{m.provider}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">{(m.tokens / 1_000_000).toFixed(1)}M</td>
                    <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-primary">{fmtUsd(m.cost)}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">{m.requests.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
