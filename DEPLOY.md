# Octroi — Déploiement (cloud managé)

Architecture cible :

```
Vercel (web, edge mondial)  ──HTTPS──>  Fly.io (proxy Hono/Bun, multi-région)
                                          ├─ Supabase        (PostgreSQL)
                                          ├─ Upstash         (Redis)
                                          └─ ClickHouse Cloud (analytics)
```

L'IaC est prête. Toutes les étapes ci-dessous nécessitent **tes comptes/accès**.

---

## 0. Ce dont j'ai besoin de toi
- **Fly.io** : `fly auth token` (ou compte + org)
- **Vercel** : compte + accès au repo Git (ou `VERCEL_TOKEN`)
- **Supabase** : projet créé → `DATABASE_URL`, URL, anon key, service role key
- **Upstash Redis** : database → `REDIS_URL` (rediss://)
- **ClickHouse Cloud** : service → URL HTTPS (`:8443`), user, password
- **Domaine** (ex. `app.octroi.io` + `api.octroi.io`) si tu veux du custom DNS
- (Optionnel) clés providers globales : `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, …

Copie `.env.production.example` → remplis les valeurs.

---

## 1. Bases de données
```bash
# Schéma PostgreSQL (Supabase)
cd packages/db
DATABASE_URL="<prod>" npx drizzle-kit migrate     # applique drizzle/*.sql

# Tables ClickHouse (analytics) — exécuter infra/clickhouse/init.sql sur ClickHouse Cloud
# via la console SQL ClickHouse Cloud, ou :
clickhouse client --host <id>.clickhouse.cloud --secure --password <pwd> --queries-file infra/clickhouse/init.sql
```

## 2. Proxy → Fly.io  (depuis la racine du repo)
```bash
fly launch --no-deploy --copy-config --name octroi-proxy   # crée l'app (fly.toml fourni)
fly secrets set \
  DATABASE_URL="..." REDIS_URL="rediss://..." \
  CLICKHOUSE_URL="https://...:8443" CLICKHOUSE_USER="default" CLICKHOUSE_PASSWORD="..." \
  ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  ALLOWED_ORIGINS="https://app.octroi.io" \
  OPENAI_API_KEY="..." ANTHROPIC_API_KEY="..."
fly deploy
fly status            # vérifier health /health/live
curl https://octroi-proxy.fly.dev/health
```

## 3. Web → Vercel
- Importer le repo dans Vercel
- **Root Directory = `apps/web`** (Vercel détecte Next.js + npm workspaces, install à la racine)
- Variables d'env (Production) :
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_URL = https://octroi-proxy.fly.dev/api`
  - `NEXT_PUBLIC_APP_URL = https://app.octroi.io`
- Deploy. (`vercel.json` fourni : framework nextjs.)

## 4. Câblage final
- Mettre `ALLOWED_ORIGINS` (Fly) = l'URL Vercel finale.
- DNS : `app.octroi.io` → Vercel ; `api.octroi.io` → Fly (optionnel, sinon `*.fly.dev`).

## 5. Smoke test prod
```bash
curl https://octroi-proxy.fly.dev/health         # db/redis/clickhouse ok
# ouvrir l'URL Vercel → landing, switch de langue, /dashboard
```

## 6. CI/CD
`.github/workflows/ci.yml` : tests (Vitest) + build sur chaque PR ; images Docker → GHCR sur `main`.
Brancher le déploiement auto (Fly/Vercel) après le premier déploiement manuel réussi.

---
**Note prod** : remplacer l'override dev ClickHouse (`infra/clickhouse/users-dev.xml`, réseau ouvert) par un vrai mot de passe — ClickHouse Cloud impose déjà l'auth, donc rien à faire côté cloud.
