"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/providers/auth-provider";

const PROVIDERS = ["OpenAI", "Anthropic", "Mistral", "Google", "Cohere"];

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none";

const SNIPPET = `# Python — any OpenAI-compatible client
from openai import OpenAI

client = OpenAI(
    base_url="https://api.octroi.io/api/v1",
    api_key="octroi_live_xxx",
    default_headers={"X-Octroi-Key": "octroi_live_xxx"},
)`;

function Panel({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
        {desc && <p className="mt-1 text-xs text-muted-foreground">{desc}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const { user } = useAuth();

  return (
    <>
      <Header eyebrow={t("eyebrow")} title={t("title")} description={t("desc")} />

      <div className="grid max-w-4xl gap-6">
        <Panel title={t("org")}>
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("email")}</label>
              <input type="text" value={user?.email ?? "demo@octroi.io"} readOnly className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t("userId")}</label>
              <input type="text" value={user?.id ?? "dev"} readOnly className={`mt-1 ${inputCls}`} />
            </div>
          </div>
        </Panel>

        <Panel title={t("providers")} desc={t("providersDesc")}>
          <div className="space-y-3">
            {PROVIDERS.map((p) => (
              <div key={p} className="flex items-center gap-3">
                <label className="w-24 font-mono text-sm">{p}</label>
                <input type="password" placeholder={t("keyPlaceholder", { provider: p })} className={`flex-1 ${inputCls}`} />
                <button className="rounded-md border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition hover:bg-background">
                  {t("save")}
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={t("integration")}>
          <p className="mb-4 text-sm text-muted-foreground">{t("integrationDesc")}</p>
          <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 font-mono text-[12px] leading-relaxed text-foreground">{SNIPPET}</pre>
        </Panel>
      </div>
    </>
  );
}
