"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";

const NAV = [
  { n: "01", key: "control", href: "/dashboard" },
  { n: "02", label: "TokenOps", href: "/tokenops" },
  { n: "03", label: "Broker", href: "/broker" },
  { n: "04", key: "governance", href: "/compliance" },
  { n: "05", label: "ESG", href: "/esg" },
  { n: "06", key: "settings", href: "/settings" },
] as const;

const TELEMETRY = [
  { label: "db", color: "var(--color-primary)" },
  { label: "cache", color: "var(--color-flux-cyan)" },
  { label: "clickhouse", color: "var(--color-flux-amber)" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const t = useTranslations("Nav");

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-background">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5 font-mono text-sm uppercase tracking-[0.24em]">
        <span className="text-primary">◢</span>
        <span className="font-semibold text-foreground">OCTROI</span>
      </div>

      <nav className="flex-1 px-2 py-4">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const label = "key" in item ? t(item.key) : item.label;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 font-mono text-[13px] uppercase tracking-wider transition-colors ${
                active ? "bg-card text-primary" : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity ${
                  active ? "opacity-100" : "opacity-0"
                }`}
              />
              <span className="text-[10px] tabular-nums opacity-50">{item.n}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {TELEMETRY.map((tm) => (
            <span key={tm.label} className="flex items-center gap-1.5">
              <span className="blink inline-block h-1.5 w-1.5 rounded-full" style={{ background: tm.color }} />
              {tm.label}
            </span>
          ))}
        </div>
        <div className="mt-3 truncate font-mono text-[11px] text-foreground">{user?.email ?? "demo@octroi.io"}</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">eu-west-3 · {t("connected")}</div>
        <button
          onClick={logout}
          className="mt-3 w-full rounded-md border border-border py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
        >
          {t("signOut")}
        </button>
      </div>
    </aside>
  );
}
