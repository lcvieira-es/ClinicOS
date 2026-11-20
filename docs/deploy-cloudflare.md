# Deploy no Cloudflare (ClinicOS)

O projeto usa **vinext** (Vite para Next.js) com o plugin Cloudflare para deploy em Workers/Pages.

## 1. Pré-requisitos

- Conta no Cloudflare (https://dash.cloudflare.com).
- Banco PostgreSQL externo (Supabase, Neon, etc.) — a estrutura e a linguagem PostgreSQL são mantidas.
- Node.js 20+.

## 2. Configurar o Hyperdrive (proxy/cache para PostgreSQL)

O Hyperdrive conecta o Worker ao PostgreSQL externo com pooling e cache de queries.

```bash
# Instalar a CLI (se necessário)
npm install -g wrangler

# Autenticar
npx wrangler login

# Criar o Hyperdrive (substitua pela sua connection string)
npx wrangler hyperdrive create clinicos-db \
  --connection-string="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"

# Copie o ID retornado e substitua em:
#   - cloudflare.config.ts -> bindings.hyperdrive({ id: "..." })
#   - wrangler.toml -> [[hyperdrive]] id = "..."
```

## 3. Variáveis de ambiente

### cloudflare.config.ts (bindings e vars não sensíveis)
Já configurado com `HYPERDRIVE`, `NODE_ENV`, `DB_SSL`, `DB_SET_ROLE`.

### Secrets (via CLI ou Dashboard)
```bash
npx wrangler secret put DATABASE_URL        # pooler (porta 6543)
npx wrangler secret put APP_DATABASE_URL    # direta (porta 5432)
npx wrangler secret put AUTH_SECRET         # chave >= 32 chars
npx wrangler secret put CRON_SECRET        # segredo do cron de auditoria
npx wrangler secret put DB_SSL             # true
npx wrangler secret put DB_SET_ROLE        # true
```

## 4. Banco de dados (PostgreSQL 16+)

Aplicar as 18 migrations + seed:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require" \
  DB_SSL=true DB_SSL_REJECT_UNAUTHORIZED=false \
  npm run db:setup-pg

# (opcional) seed de produção
PROD_ADMIN_EMAIL=admin@suaclinica.com PROD_ADMIN_PASSWORD=SenhaForte123! \
  DATABASE_URL="postgresql://..." npm run db:seed-prod
```

Validação:
```bash
DATABASE_URL="postgresql://..." npm run db:check
DATABASE_URL="postgresql://..." npm run rls:check
```

## 5. Deploy

```bash
# Desenvolvimento local (Vite)
npm run dev:vinext

# Build
npm run build:vinext

# Deploy para Cloudflare
npm run deploy:vinext
```

## 6. Pós-deploy

- Acessar `https://clinicos.<subdomain>.workers.dev/login`.
- Validar `/api/health` → `{"status":"ok","database":"ok",...}`.
- O cron de auditoria roda diariamente às 03:00 UTC (configurado em `wrangler.toml` `[triggers]`).

## 7. Observações

- A estrutura PostgreSQL é mantida (migrations em `db/migrations/*.sql` e `supabase/migrations/`).
- O Hyperdrive fornece pooling e cache de queries na edge.
- O PGlite (`.data/clinicos`) é apenas para desenvolvimento local.
- As dependências nativas (`@node-rs/argon2`, `pg`) funcionam no runtime Node.js compat do Cloudflare.
- O `@vercel/speed-insights` é específico da Vercel; pode ser removido se não usado.
