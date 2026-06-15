# TokenForge - Guide de Deploiement

## Architecture

```
Client ──> Nginx (SSL/443) ──┬──> Web App (Next.js :3000)
                             └──> Proxy API (Hono/Bun :8787) ──┬──> PostgreSQL (Supabase)
                                                               ├──> ClickHouse (Analytics)
                                                               └──> Redis (Cache)
```

## Prerequisites

- Docker & Docker Compose v2.20+
- Node.js 20+ et Bun 1.1+ (dev local uniquement)
- Un domaine avec DNS configure (production)

---

## 1. Developpement local

```bash
# Cloner et installer
git clone <repo-url> && cd TokenForge
npm install

# Configurer l'environnement
cp .env.example .env
# Editer .env avec vos valeurs (voir section Variables d'environnement)

# Generer la cle de chiffrement
openssl rand -hex 32
# Copier le resultat dans ENCRYPTION_KEY de .env

# Lancer l'infrastructure (PostgreSQL, ClickHouse, Redis)
docker compose -f infra/docker-compose.yml up -d

# Pousser le schema DB
npm run db:push

# Lancer en dev (proxy + web en parallele)
npm run dev
```

- Web: http://localhost:3000
- Proxy API: http://localhost:8787
- Health check: http://localhost:8787/health

---

## 2. Deploiement Production (Docker Compose)

### 2.1 Prerequis serveur

- 2 CPU, 4 Go RAM minimum
- Docker & Docker Compose installes
- Ports 80 et 443 ouverts
- Domaine pointe vers le serveur

### 2.2 Configuration

```bash
# Sur le serveur
git clone <repo-url> && cd TokenForge
cp .env.example .env
```

Editer `.env` avec les valeurs de production :

```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:<MOT_DE_PASSE>@supabase-db:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<votre-service-key>
CLICKHOUSE_PASSWORD=<mot_de_passe_fort>
REDIS_PASSWORD=<mot_de_passe_fort>
POSTGRES_PASSWORD=<mot_de_passe_fort>
ENCRYPTION_KEY=<openssl rand -hex 32>
ALLOWED_ORIGINS=https://votre-domaine.eu
NEXT_PUBLIC_APP_URL=https://votre-domaine.eu
NEXT_PUBLIC_API_URL=https://votre-domaine.eu/api
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
```

### 2.3 Certificats SSL

```bash
# Option A : Let's Encrypt (recommande)
sudo apt install certbot
sudo certbot certonly --standalone -d votre-domaine.eu
sudo cp /etc/letsencrypt/live/votre-domaine.eu/fullchain.pem infra/nginx/certs/
sudo cp /etc/letsencrypt/live/votre-domaine.eu/privkey.pem infra/nginx/certs/

# Option B : Certificats auto-signes (dev/test)
mkdir -p infra/nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infra/nginx/certs/privkey.pem \
  -out infra/nginx/certs/fullchain.pem \
  -subj "/CN=votre-domaine.eu"
```

### 2.4 Lancement

```bash
# Build et demarrage
docker compose -f infra/docker-compose.prod.yml up -d --build

# Verifier que tout fonctionne
curl https://votre-domaine.eu/health

# Voir les logs
docker compose -f infra/docker-compose.prod.yml logs -f proxy
docker compose -f infra/docker-compose.prod.yml logs -f web
```

### 2.5 Initialisation de la base

```bash
# Pousser le schema Drizzle
docker compose -f infra/docker-compose.prod.yml exec proxy \
  bun run db:push

# ClickHouse est initialise automatiquement via init.sql
```

---

## 3. Variables d'environnement

| Variable | Requis | Description |
|----------|--------|-------------|
| `NODE_ENV` | Oui | `development`, `staging`, `production` |
| `DATABASE_URL` | Oui | URL PostgreSQL (format `postgresql://...`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Oui | Cle anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | Cle service role Supabase |
| `CLICKHOUSE_URL` | Oui | URL ClickHouse (defaut: `http://localhost:8123`) |
| `CLICKHOUSE_DB` | Non | Base ClickHouse (defaut: `tokenforge`) |
| `CLICKHOUSE_PASSWORD` | Prod | Mot de passe ClickHouse |
| `REDIS_URL` | Oui | URL Redis (defaut: `redis://localhost:6379`) |
| `REDIS_PASSWORD` | Prod | Mot de passe Redis |
| `ENCRYPTION_KEY` | Oui | Cle 64 caracteres hex (`openssl rand -hex 32`) |
| `ALLOWED_ORIGINS` | Oui | Origines CORS (separees par virgule) |
| `PROXY_PORT` | Non | Port du proxy (defaut: `8787`) |
| `LOG_LEVEL` | Non | Niveau de log (defaut: `info`) |
| `NEXT_PUBLIC_API_URL` | Oui | URL publique de l'API proxy |
| `OPENAI_API_KEY` | Non | Cle API OpenAI (fallback global) |
| `ANTHROPIC_API_KEY` | Non | Cle API Anthropic (fallback global) |
| `POSTGRES_PASSWORD` | Prod | Mot de passe PostgreSQL (Docker) |

---

## 4. Endpoints de sante

| Endpoint | Usage | Reponse |
|----------|-------|---------|
| `GET /health` | Health check complet | DB, Redis, ClickHouse status + latences |
| `GET /health/live` | Liveness probe (K8s) | `{"status":"ok"}` si le process est vivant |
| `GET /health/ready` | Readiness probe (K8s) | `200` si DB connectee, `503` sinon |

---

## 5. CI/CD

Le fichier `.github/workflows/ci.yml` configure :

1. **Sur chaque PR** : lint + typecheck + build
2. **Sur push main** : build + push des images Docker vers GHCR

Images disponibles :
- `ghcr.io/<repo>/proxy:latest`
- `ghcr.io/<repo>/web:latest`

---

## 6. Monitoring

### Logs structures

En production, tous les logs sont en JSON :
```json
{"level":"info","msg":"Request completed","requestId":"req_abc123","latency_ms":45,"ts":1706000000}
```

Rediriger vers votre aggregateur (Datadog, Grafana Loki, etc.) :
```bash
docker compose logs proxy | your-log-shipper
```

### Metriques cles a surveiller

- **Latence API** : `avg_latency` dans `/health`
- **Taux d'erreurs** : ratio de reponses 5xx dans ClickHouse
- **Cache hit rate** : `cache_hits / total_requests` via `/v1/analytics/savings`
- **Connexions DB** : pool max 10 par defaut
- **Rate limiting** : headers `X-RateLimit-Remaining` dans les reponses

---

## 7. Troubleshooting

### Le proxy ne demarre pas
```bash
# Verifier les variables d'environnement
docker compose exec proxy env | grep DATABASE_URL
# Le proxy crash early si une var requise manque
docker compose logs proxy --tail 50
```

### Erreur de connexion DB
```bash
# Tester la connectivite
docker compose exec proxy bun -e "
const pg = require('postgres');
const sql = pg('$DATABASE_URL');
sql\`SELECT 1\`.then(() => console.log('OK')).catch(console.error);
"
```

### Redis inaccessible
```bash
docker compose exec redis redis-cli -a "$REDIS_PASSWORD" ping
```

### ClickHouse ne repond pas
```bash
docker compose exec clickhouse clickhouse-client --query "SELECT 1"
```

### Renouveler les certificats SSL
```bash
sudo certbot renew
sudo cp /etc/letsencrypt/live/votre-domaine.eu/*.pem infra/nginx/certs/
docker compose -f infra/docker-compose.prod.yml restart nginx
```

---

## 8. Commandes utiles

```bash
# Redemarrer un service
docker compose -f infra/docker-compose.prod.yml restart proxy

# Mise a jour (zero downtime)
git pull
docker compose -f infra/docker-compose.prod.yml up -d --build proxy web

# Backup PostgreSQL
docker compose exec supabase-db pg_dump -U postgres postgres > backup.sql

# Voir les requetes recentes (ClickHouse)
docker compose exec clickhouse clickhouse-client \
  --query "SELECT * FROM tokenforge.requests ORDER BY timestamp DESC LIMIT 10"

# Purger le cache Redis
docker compose exec redis redis-cli -a "$REDIS_PASSWORD" FLUSHDB
```
