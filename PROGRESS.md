# Octroi — État du chantier

> **Octroi** — le plan de contrôle de *toute* votre IA (mondial, multi-fournisseurs, multi-régions).
> Tout le trafic IA passe par une porte : mesuré, routé, gouverné. *« Le jour où un fournisseur vous coupe l'accès, vous ne tombez pas. »*

## Lancer en local
```bash
# Infra (Postgres 54322, ClickHouse 8123, Redis = celui de l'hôte sur 6379)
docker compose -f infra/docker-compose.yml up -d supabase-db clickhouse redis
# Schéma
cd packages/db && DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres" npx drizzle-kit push --force
# Proxy (Bun) — port 8787
cd apps/proxy && ~/.bun/bin/bun run src/index.ts
# Web (Next) — bascule sur 3001 car 3000 est pris par Docker
cd apps/web && npm run dev
```
- Bypass auth **dev-only** actif (middleware) : `/dashboard` accessible sans Supabase réel en local.
- `.env` présents dans `apps/proxy/.env` et `apps/web/.env.local`.

## Fait & vérifié
- ✅ **Build** : monorepo type-check 0 erreur (7/7 workspaces). Corrigé : typage contexte Hono, enum `risk_level` (`not_assessed`), cookies Supabase, filtres turbo `package.json`.
- ✅ **DB** : migrations Drizzle générées (`packages/db/drizzle/0000_*.sql`, 15 tables) + appliquées.
- ✅ **Run** : proxy `/health` vert (db/redis/clickhouse), web servi.
- ✅ **Rebrand** : TokenForge → **Octroi** partout (UI, header `X-Octroi-Key`, logo OC).
- ✅ **Design "Flux"** (système global, `apps/web/app/globals.css`) : encre `#0A0D0B`, signal lime `#C6F24E`, accents cyan/ambre/corail ; fonts **Archivo + IBM Plex Mono** ; fond grille. Surface de contrôle vivante (la porte + flux animé + compteurs), pas un dashboard.
- ✅ **Pages refondues Flux** : landing (`app/page.tsx`), shell/rail (`components/layout/sidebar.tsx`, `header.tsx`), dashboard (`app/dashboard/page.tsx`), graphes (`components/charts/overview-charts.tsx`).
- ✅ **i18n** : `next-intl` (cookie), **4 langues en/fr/es/zh**, défaut anglais, sélecteur. Traduits : landing, shell, dashboard, graphes. Dictionnaires : `apps/web/messages/*.json`.

- ✅ **Registry de providers data-driven** : `ProviderDefinition` (Zod, `packages/shared/src/providers.ts`) + adaptateurs de protocole (`apps/proxy/src/broker/adapters.ts`) + table `provider_catalog` (override org/global) + endpoints `GET/POST /v1/broker/providers`. 15 seed, ajout à chaud vérifié (→16). Ajouter un provider = config, pas de code.
- ✅ **Clé dev seedée** : org `dev` (enterprise) + clé API `octroi_dev_key` (header `X-Octroi-Key`). Permet de tester l'API authentifiée en local.

- ✅ **App fonctionnelle de bout en bout** : navigateur → proxy (auth clé dev) → ClickHouse/PG → **vraies données**. Dashboard : coût réel 4,16 $, 1.0M tokens, cache 21.8 %, courbe coût/jour, ESG (CO₂ réel), Compliance (3 systèmes audités).
- ✅ Fixes : analytics ClickHouse `parseDateTimeBestEffort` (timestamps ISO) · CORS proxy ouvert à `:3001` · clé dev câblée au web (`NEXT_PUBLIC_DEV_API_KEY`).
- ⚠️ **Dev ClickHouse** : user `default` était localhost-only → override `users.d/zz-open-default.xml` (réseau `::/0`) écrit dans le conteneur en cours. **À rendre reproductible** (monter le fichier dans `docker-compose` ou vrai mot de passe) pour la prod.

## Reste à faire (avant déploiement)
1. **Refonte Flux + i18n des 5 pages** : `tokenops`, `broker`, `compliance`, `esg`, `settings` (encore en cards/tableaux FR clairs sur fond sombre → à passer en console Flux + `useTranslations`). Ajouter namespaces `TokenOps`/`Compliance`/`Broker`/`Esg`/`Settings` dans les 4 dictionnaires.
2. **Backend** : brancher la **persistance** des requêtes (proxy → PostgreSQL `requests` + `carbon_footprints`) — aujourd'hui non écrite ; renommer le "semantic cache" (cache exact) ou implémenter le vrai (embeddings).
3. **Tests** : Vitest (unitaire : pricing, esg-engine, compliance-engine) + Playwright e2e multi-locale (landing EN/ZH, dashboard).
4. **Prod-ready** : `turbopack.root` (warning lockfile), CI GitHub Actions, headers, **SEO i18n** (routes `/[locale]` + `hreflang` + sitemap), images Docker.
5. **Déploiement (cloud managé)** : Web→Vercel, Proxy→Fly.io/Railway, Postgres→Supabase, Redis→Upstash, ClickHouse→ClickHouse Cloud. **Nécessite les comptes/secrets du client.**

## Notes
- Badge preview « 1 Issue » = warning Turbopack bénin (workspace-root : 2 lockfiles `/Users/m/pnpm-lock.yaml` + projet). À régler via `turbopack.root` dans `next.config.ts`.
- Dossier projet encore nommé `TokenForge` (apparaît dans les chemins dev, invisible en prod). Renommage optionnel.
- Souveraineté/résidence EU = **option** (route où tu veux), plus l'identité (positionnement mondial).
