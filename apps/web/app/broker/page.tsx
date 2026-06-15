"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { useApi, apiClient } from "@/lib/use-api";

interface ProviderDef {
  id: string;
  name: string;
  kind: string;
  protocol: string;
  region: string;
  enabled: boolean;
  baseUrl?: string;
  models: { id: string }[];
}

const KIND_COLOR: Record<string, string> = {
  closed: "#4FE0D0",
  open: "#C6F24E",
  aggregator: "#E9B23A",
  "self-hosted": "#828C7C",
};

const KINDS = ["closed", "open", "aggregator", "self-hosted"];
const PROTOCOLS = ["openai", "anthropic", "google", "cohere", "custom"];

const inputCls =
  "rounded-md border border-border bg-background px-2.5 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none";

export default function BrokerPage() {
  const t = useTranslations("Broker");
  const fetchProviders = useCallback(() => apiClient.broker.getProviders(), []);
  const { data, loading, refetch } = useApi<{ providers: ProviderDef[]; count: number }>(fetchProviders);
  const providers = data?.providers ?? [];

  const [form, setForm] = useState({ id: "", name: "", baseUrl: "", kind: "open", protocol: "openai" });
  const [adding, setAdding] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id || !form.name || !form.baseUrl) return;
    setAdding(true);
    try {
      await apiClient.broker.addProvider({ ...form, auth: { type: "bearer" }, models: [] });
      setForm({ id: "", name: "", baseUrl: "", kind: "open", protocol: "openai" });
      refetch();
    } catch {
      /* surfaced globally */
    } finally {
      setAdding(false);
    }
  }

  const byKind = KINDS.map((k) => ({ k, n: providers.filter((p) => p.kind === k).length }));

  return (
    <>
      <Header eyebrow={t("eyebrow")} title={t("title")} description={t("desc")} />

      {/* Readouts */}
      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-5">
        <div className="bg-card p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("total")}</div>
          <div className="mt-2 font-mono text-xl font-semibold tabular-nums text-primary">{providers.length}</div>
        </div>
        {byKind.map(({ k, n }) => (
          <div key={k} className="bg-card p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t(`kind_${k}` as any)}</div>
            <div className="mt-2 font-mono text-xl font-semibold tabular-nums" style={{ color: KIND_COLOR[k] }}>{n}</div>
          </div>
        ))}
      </div>

      {/* Add provider — data-driven */}
      <form onSubmit={add} className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("add")}</div>
        <div className="grid gap-2 sm:grid-cols-6">
          <input className={inputCls} placeholder={t("f_id")} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          <input className={inputCls} placeholder={t("f_name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={`${inputCls} sm:col-span-2`} placeholder={t("f_baseUrl")} value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
          <select className={inputCls} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            {KINDS.map((k) => <option key={k} value={k}>{t(`kind_${k}` as any)}</option>)}
          </select>
          <select className={inputCls} value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })}>
            {PROTOCOLS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="mt-3 rounded-md bg-primary px-4 py-2 font-mono text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          {adding ? t("f_adding") : t("f_submit")}
        </button>
      </form>

      {/* Catalogue */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>{t("title")}</span>
          <span className="tabular-nums">{providers.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[t("p_provider"), t("p_kind"), t("p_protocol"), t("p_region"), t("p_models"), t("p_status")].map((h, i) => (
                  <th key={h} className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground ${i >= 4 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center font-mono text-sm text-muted-foreground">{t("loading")}</td></tr>
              ) : providers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center font-mono text-sm text-muted-foreground">{t("nodata")}</td></tr>
              ) : (
                providers.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 transition-colors hover:bg-background/40">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm">{p.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{p.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: KIND_COLOR[p.kind] ?? "#828C7C", background: "color-mix(in srgb, " + (KIND_COLOR[p.kind] ?? "#828C7C") + " 13%, transparent)" }}>
                        {t(`kind_${p.kind}` as any)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{p.protocol}</td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{p.region}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">{p.models?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider" style={{ color: p.enabled ? "var(--color-primary)" : "var(--color-muted-foreground)" }}>
                        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: p.enabled ? "var(--color-primary)" : "var(--color-muted-foreground)" }} />
                        {p.enabled ? t("on") : t("off")}
                      </span>
                    </td>
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
