"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { useApi, apiClient } from "@/lib/use-api";

interface SystemStatus {
  id: string;
  name: string;
  risk_level: string;
  total_checks: number;
  compliant: number;
  non_compliant: number;
  review_needed: number;
}

interface ComplianceStatus {
  score: number;
  total_systems: number;
  compliant_systems: number;
  systems: SystemStatus[];
}

const RISK_COLOR: Record<string, string> = {
  unacceptable: "#F2557D",
  high: "#E9B23A",
  limited: "#4FE0D0",
  minimal: "#C6F24E",
  not_assessed: "#828C7C",
};

const STATUS_COLOR: Record<string, string> = {
  compliant: "#C6F24E",
  non_compliant: "#F2557D",
  review_needed: "#E9B23A",
};

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
      style={{ color, background: "color-mix(in srgb, " + color + " 13%, transparent)" }}
    >
      {children}
    </span>
  );
}

export default function CompliancePage() {
  const t = useTranslations("Compliance");
  const fetchStatus = useCallback(() => apiClient.compliance.getStatus(), []);
  const { data, loading, error, refetch } = useApi<ComplianceStatus>(fetchStatus);
  const [auditing, setAuditing] = useState<string | null>(null);

  async function handleAudit(systemId: string) {
    setAuditing(systemId);
    try {
      await apiClient.compliance.runAudit(systemId);
      refetch();
    } catch {
      /* handled globally */
    } finally {
      setAuditing(null);
    }
  }

  const score = data?.score ?? 0;
  const systems = data?.systems ?? [];
  const nonCompliant = systems.filter((s) => s.non_compliant > 0).length;
  const reviewNeeded = systems.filter((s) => s.review_needed > 0 && s.non_compliant === 0).length;
  const scoreColor = score >= 80 ? "var(--color-primary)" : score >= 50 ? "var(--color-flux-amber)" : "var(--color-destructive)";

  function systemStatus(sys: SystemStatus): string {
    if (sys.non_compliant > 0) return "non_compliant";
    if (sys.review_needed > 0) return "review_needed";
    if (sys.total_checks > 0) return "compliant";
    return "review_needed";
  }

  return (
    <>
      <Header eyebrow={t("eyebrow")} title={t("title")} description={t("desc")} />

      {error && (
        <div className="mb-6 border border-border border-l-2 bg-card p-4 font-mono text-sm" style={{ borderLeftColor: "var(--color-destructive)", color: "var(--color-destructive)" }}>
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {/* Score */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("scoreGlobal")}</div>
          <div className="mt-4 flex items-end gap-2">
            <span className="font-mono text-5xl font-semibold tabular-nums" style={{ color: scoreColor }}>{loading ? "—" : score}</span>
            <span className="mb-1 font-mono text-xl text-muted-foreground">/100</span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background">
            <div className="h-full rounded-full" style={{ width: `${score}%`, background: scoreColor }} />
          </div>
          <div className="mt-3 font-mono text-[11px] text-muted-foreground">
            {loading ? "" : t("systemsCompliant", { a: data?.compliant_systems ?? 0, b: data?.total_systems ?? 0 })}
          </div>
        </div>

        {/* Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("breakdown")}</div>
          <div className="space-y-3 font-mono text-sm">
            {[
              { c: "#C6F24E", label: t("compliant"), v: data?.compliant_systems ?? 0 },
              { c: "#F2557D", label: t("nonCompliant"), v: nonCompliant },
              { c: "#E9B23A", label: t("toReview"), v: reviewNeeded },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: row.c }} />{row.label}</span>
                <span className="tabular-nums" style={{ color: row.c }}>{row.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-border border-l-2 bg-card p-6" style={{ borderLeftColor: nonCompliant > 0 ? "var(--color-destructive)" : reviewNeeded > 0 ? "var(--color-flux-amber)" : "var(--color-primary)" }}>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("actionsRequired")}</div>
          <p className="font-mono text-sm" style={{ color: nonCompliant > 0 ? "var(--color-destructive)" : reviewNeeded > 0 ? "var(--color-flux-amber)" : "var(--color-primary)" }}>
            {nonCompliant > 0 ? t("nonCompliantMsg", { n: nonCompliant }) : reviewNeeded > 0 ? t("reviewMsg", { n: reviewNeeded }) : t("allCompliant")}
          </p>
        </div>
      </div>

      {/* Systems table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("systemsTable")}</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("system")}</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("riskLevel")}</th>
                <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("checks")}</th>
                <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("status")}</th>
                <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("action")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center font-mono text-sm text-muted-foreground">{t("loading")}</td></tr>
              ) : systems.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center font-mono text-sm text-muted-foreground">{t("noSystems")}</td></tr>
              ) : (
                systems.map((sys) => {
                  const st = systemStatus(sys);
                  return (
                    <tr key={sys.id} className="border-b border-border last:border-0 transition-colors hover:bg-background/40">
                      <td className="px-4 py-3 font-mono text-sm">{sys.name}</td>
                      <td className="px-4 py-3"><Pill color={RISK_COLOR[sys.risk_level] ?? "#828C7C"}>{t(`risk_${sys.risk_level}` as any)}</Pill></td>
                      <td className="px-4 py-3 text-center font-mono text-sm tabular-nums">
                        <span style={{ color: "#C6F24E" }}>{sys.compliant}</span>
                        {sys.non_compliant > 0 && <> / <span style={{ color: "#F2557D" }}>{sys.non_compliant}</span></>}
                        {sys.review_needed > 0 && <> / <span style={{ color: "#E9B23A" }}>{sys.review_needed}</span></>}
                        <span className="text-muted-foreground"> / {sys.total_checks}</span>
                      </td>
                      <td className="px-4 py-3 text-center"><Pill color={STATUS_COLOR[st]}>{t(`status_${st}` as any)}</Pill></td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleAudit(sys.id)}
                          disabled={auditing === sys.id}
                          className="font-mono text-[11px] uppercase tracking-wider text-primary transition hover:brightness-110 disabled:opacity-50"
                        >
                          {auditing === sys.id ? t("auditing") : t("runAudit")}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
