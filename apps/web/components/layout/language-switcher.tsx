"use client";

import { useLocale } from "next-intl";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";

export function LanguageSwitcher() {
  const locale = useLocale();

  function setLocale(l: string) {
    document.cookie = `locale=${l}; path=/; max-age=31536000`;
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-0.5 font-mono text-[11px] uppercase tracking-wider">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded px-1.5 py-0.5 transition-colors ${
            l === locale ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={`Switch language to ${l}`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
