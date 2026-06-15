"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { useApi, apiClient } from "@/lib/use-api";

interface Footprint {
  co2_kg: number;
  energy_kwh: number;
  avg_pue: number;
  request_count: number;
}

export default function EsgPage() {
  const t = useTranslations("Esg");
  const fetchFootprint = useCallback(() => apiClient.esg.getFootprint(), []);
  const { data, loading } = useApi<{ footprint: Footprint; period: any }>(fetchFootprint);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const f = data?.footprint;

  async function generate() {
    setGenerating(true);
    setMsg(null);
    try {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      await apiClient.esg.generateCertificate({ period_start: monthAgo.toISOString(), period_end: now.toISOString() });
      setMsg({ ok: true, text: t("certOk") });
    } catch {
      setMsg({ ok: false, text: t("certErr") });
    } finally {
      setGenerating(false);
    }
  }

  const cards = [
    { label: t("co2"), value: loading ? "—" : `${(f?.co2_kg ?? 0).toFixed(2)} kg`, sub: t("co2sub"), accent: "var(--color-primary)" },
    { label: t("energy"), value: loading ? "—" : `${(f?.energy_kwh ?? 0).toFixed(2)} kWh`, sub: t("energysub"), accent: "var(--color-flux-cyan)" },
    { label: t("pue"), value: loading ? "—" : (f?.avg_pue ?? 0).toFixed(2), sub: t("puesub"), accent: "var(--color-foreground)" },
    { label: t("requests"), value: loading ? "—" : (f?.request_count ?? 0).toLocaleString(), sub: t("requestssub"), accent: "var(--color-foreground)" },
  ];

  return (
    <>
      <Header eyebrow={t("eyebrow")} title={t("title")} description={t("desc")} />

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{c.label}</div>
            <div className="mt-2 font-mono text-xl font-semibold tabular-nums" style={{ color: c.accent }}>{c.value}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("certTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("certDesc")}</p>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="rounded-md bg-primary px-4 py-2 font-mono text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            {generating ? t("certGen") : t("certBtn")}
          </button>
        </div>
        {msg && (
          <p className="mt-4 font-mono text-sm" style={{ color: msg.ok ? "var(--color-primary)" : "var(--color-destructive)" }}>
            {msg.text}
          </p>
        )}
      </div>
    </>
  );
}
