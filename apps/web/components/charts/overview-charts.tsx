"use client";

import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface UsageRow {
  date: string;
  provider: string;
  model: string;
  total_tokens: number;
  total_cost: number;
  avg_latency: number;
  request_count: number;
}

const SERIES = ["#C6F24E", "#4FE0D0", "#E9B23A", "#F2557D", "#828C7C"];
const GRID = "#1F271D";
const AXIS = "#828C7C";
const TOOLTIP = { borderRadius: "8px", border: "1px solid #1F271D", background: "#111611", color: "#E9E7DE", fontFamily: "var(--font-mono)", fontSize: "12px" };

export function OverviewCharts({ usageData }: { usageData: UsageRow[] }) {
  const t = useTranslations("Charts");

  const dailyMap = new Map<string, { date: string; cost: number; tokens: number }>();
  for (const row of usageData) {
    const dateKey = row.date?.slice(0, 10) || "unknown";
    const existing = dailyMap.get(dateKey) || { date: dateKey, cost: 0, tokens: 0 };
    existing.cost += Number(row.total_cost);
    existing.tokens += Number(row.total_tokens);
    dailyMap.set(dateKey, existing);
  }
  const dailyUsage = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const modelMap = new Map<string, number>();
  for (const row of usageData) {
    modelMap.set(row.model, (modelMap.get(row.model) || 0) + Number(row.total_tokens));
  }
  const totalTokens = Array.from(modelMap.values()).reduce((s, v) => s + v, 0) || 1;
  const modelDistribution = Array.from(modelMap.entries())
    .map(([name, value], i) => ({ name, value: Math.round((value / totalTokens) * 100), color: SERIES[i % SERIES.length] }))
    .sort((a, b) => b.value - a.value);

  const providerMap = new Map<string, { cost: number; tokens: number }>();
  for (const row of usageData) {
    const existing = providerMap.get(row.provider) || { cost: 0, tokens: 0 };
    existing.cost += Number(row.total_cost);
    existing.tokens += Number(row.total_tokens);
    providerMap.set(row.provider, existing);
  }
  const providerCost = Array.from(providerMap.entries())
    .map(([provider, data]) => ({ provider, ...data }))
    .sort((a, b) => b.cost - a.cost);

  if (usageData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center font-mono text-sm uppercase tracking-wider text-muted-foreground">
        {t("nodata")}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("dailyCost")}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyUsage}>
            <defs>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C6F24E" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#C6F24E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} />
            <YAxis tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} />
            <Tooltip contentStyle={TOOLTIP} formatter={(value: number) => [`$${value.toFixed(2)}`, t("cost")]} />
            <Area type="monotone" dataKey="cost" stroke="#C6F24E" fill="url(#colorCost)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("modelSplit")}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={modelDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
              {modelDistribution.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="#0A0D0B" />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP} formatter={(value: number) => [`${value}%`, t("share")]} />
            <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: AXIS }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
        <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("providerCost")}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={providerCost}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="provider" tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} />
            <YAxis tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} />
            <Tooltip
              contentStyle={TOOLTIP}
              cursor={{ fill: "rgba(198,242,78,0.06)" }}
              formatter={(value: number, name: string) =>
                name === "cost" ? [`$${value.toFixed(2)}`, t("cost")] : [value.toLocaleString(), t("tokens")]
              }
            />
            <Bar dataKey="cost" fill="#C6F24E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
