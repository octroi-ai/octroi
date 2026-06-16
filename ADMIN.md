# Octroi — Admin & opérations

> Tout ce qu'il faut pour gérer le projet déployé : repo, URLs, comptes, redéploiement, sécurité.

## 🔗 Liens essentiels
| Quoi | URL |
|---|---|
| **Code (repo)** | https://github.com/octroi-ai/octroi |
| **App web (live)** | https://octroi.netlify.app |
| **Proxy API (live)** | https://octroi-proxy.onrender.com |
| **Health du proxy** | https://octroi-proxy.onrender.com/health |

## 🧱 Stack & comptes (100% gratuit, sans carte)
| Service | Rôle | Identifiants | Dashboard |
|---|---|---|---|
| **GitHub** | code | compte `octroi-ai` · repo `octroi` · branche `main` | github.com/octroi-ai/octroi |
| **Netlify** | hébergement web | projet `octroi` · site id `15d1912a-c0ff-49fd-9a85-03a1a1f4fdd9` | app.netlify.com/projects/octroi |
| **Render** | proxy (Docker) | service `octroi-proxy` (`srv-d8o8memgvqtc7382dbm0`) · région Frankfurt | dashboard.render.com |
| **Supabase** | base PostgreSQL | projet `rkgaymddfhefekauazxo` · région `eu-central-1` | supabase.com/dashboard/project/rkgaymddfhefekauazxo |

## 🏗️ Architecture
```
Navigateur → Netlify (Next.js, SSR + edge functions)
                 │  appelle  NEXT_PUBLIC_API_URL
                 ▼
            Render (proxy Hono/Bun) → Supabase Postgres (via POOLER)
```
- **DB depuis Render = TOUJOURS le pooler** : `aws-1-eu-central-1.pooler.supabase.com:5432` (session), user `postgres.rkgaymddfhefekauazxo`, **`?sslmode=require`**.
  ⚠️ L'hôte direct `db.<ref>.supabase.co` est **IPv6-only** et **ne marche PAS depuis Render**. Ne jamais l'utiliser côté serveur.
- **ClickHouse (analytics)** : *pas déployé* → graphes coût/tokens du dashboard vides. (Optionnel : ClickHouse Cloud gratuit.)
- **Redis** : *pas déployé* → cache/rate-limit inactifs (le proxy tourne quand même).

## ⚙️ Variables d'environnement
**Render → Environment** (proxy) :
- `NODE_ENV=production`
- `DATABASE_URL` = chaîne **pooler** + `?sslmode=require`
- `ENCRYPTION_KEY` = *(secret 64-hex, stocké dans Render — chiffre les clés providers)*
- `ALLOWED_ORIGINS=https://octroi.netlify.app`

**Netlify** (web) — injectées **au build** (déploiement local, voir plus bas) :
- `NEXT_PUBLIC_SUPABASE_URL=https://rkgaymddfhefekauazxo.supabase.co`
- `NEXT_PUBLIC_API_URL=https://octroi-proxy.onrender.com/api`
- `NEXT_PUBLIC_DEV_API_KEY=octroi_demo_key`  *(clé de démo)*
- `NEXT_PUBLIC_DEMO_MODE=1`  *(dashboard public, bypass login)*
- `NEXT_PUBLIC_APP_URL=https://octroi.netlify.app`

## 🔁 Redéploiement
**Proxy (Render)** — auto à chaque `git push` sur `main` (build Docker depuis `apps/proxy/Dockerfile`). Ou « Manual Deploy » dans le dashboard.

**Web (Netlify)** — ⚠️ le build auto-Git **échoue** (monorepo Turborepo mal détecté). Redéploiement = build + deploy **local** depuis `apps/web` :
```bash
cd apps/web
export NETLIFY_AUTH_TOKEN=<ton_token_netlify>
export NETLIFY_SITE_ID=15d1912a-c0ff-49fd-9a85-03a1a1f4fdd9
export NEXT_PUBLIC_SUPABASE_URL=https://rkgaymddfhefekauazxo.supabase.co
export NEXT_PUBLIC_API_URL=https://octroi-proxy.onrender.com/api
export NEXT_PUBLIC_DEV_API_KEY=octroi_demo_key
export NEXT_PUBLIC_DEMO_MODE=1
export NEXT_PUBLIC_APP_URL=https://octroi.netlify.app
npx netlify-cli deploy --prod --build
```
*(Pour réparer l'auto-deploy Netlify : définir le « base/package directory » monorepo = `apps/web` dans le dashboard.)*

## 🗄️ Base de données
- Schéma appliqué (**16 tables**). Données de démo seedées : org `demo`, clé API `octroi_demo_key`, 3 systèmes IA, empreinte carbone, 30 requêtes.
- Réappliquer/migrer : exécuter `packages/db/drizzle/0000_*.sql` puis `0001_*.sql` dans le **SQL Editor** Supabase, ou `drizzle-kit push` avec le `DATABASE_URL` pooler.

## 🔑 Git / pousser des modifs toi-même
Le code est poussé via une **clé SSH temporaire** (à ma session — elle disparaîtra). Pour pousser toi-même :
- ajoute **ta** clé SSH sur GitHub (Settings → SSH keys) **ou** utilise HTTPS avec un token, puis :
```bash
git clone git@github.com:octroi-ai/octroi.git   # ou https://github.com/octroi-ai/octroi.git
```

## ⚠️ SÉCURITÉ — à faire MAINTENANT
Tous les tokens ci-dessous ont transité dans le chat → **révoque-les** :
- [ ] **GitHub** : 3 Personal Access Tokens → github.com/settings/tokens
- [ ] **Render** API key → dashboard.render.com → Account Settings → API Keys
- [ ] **Netlify** token → app.netlify.com/user/applications
- [ ] **Fly.io** token → fly.io/tokens (compte non utilisé au final)
- [ ] **Supabase** : **change le mot de passe DB** (Settings → Database → Reset password) → puis mets à jour `DATABASE_URL` dans **Render**
- [ ] Clé SSH `octroi deploy` : la garder (si tu veux pousser via ma config — non, elle est temporaire) ou la supprimer et mettre la tienne.

**Mode démo** : `NEXT_PUBLIC_DEMO_MODE=1` = dashboard **public**. Pour de la vraie prod → `=0`, brancher le login Supabase (clé anon réelle), retirer `NEXT_PUBLIC_DEV_API_KEY`.
