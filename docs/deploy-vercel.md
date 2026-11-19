# Deploy no Vercel (ClinicOS)

## 0. Supabase — criação do banco

1. Crie um projeto em https://supabase.com (região mais próxima, ex.: `South America (São Paulo)`).
2. Em **Project Settings → Database**, copie:
   - **Connection string (Transaction pooler)** → porta `6543` (usar em `DATABASE_URL` na Vercel).
   - **Connection string (Direct)** → porta `5432` (usar para migrations).
3. Em **SQL Editor**, execute:
   ```sql
   create extension if not exists pgcrypto;
   create extension if not exists pg_trgm;
   create extension if not exists btree_gist;
   create role clinicos_app login password 'SENHA_FORTE' nosuperuser nobypassrls;
   ```
4. Teste a conexão localmente:
   ```bash
   DATABASE_URL="postgresql://postgres:SENHA@db.xxx.supabase.co:5432/postgres?sslmode=require" \
     DB_SSL=true DB_SSL_REJECT_UNAUTHORIZED=false \
     npm run db:test-connection
   ```

## 1. Variáveis de ambiente (Vercel Dashboard → Settings → Environment Variables)

| Variável | Obrigatória | Valor |
|---|---|---|
| `DATABASE_URL` | sim | Pooler do Supabase (porta `6543`): `postgresql://postgres.xxx:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require` |
| `APP_DATABASE_URL` | recomendado | Conexão direta (porta `5432`): `postgresql://postgres:senha@db.xxx.supabase.co:5432/postgres?sslmode=require` (runtime, role `clinicos_app`) |
| `DB_SET_ROLE` | não | `true` se a role `clinicos_app` deve ser aplicada por transação (default `true`) |
| `AUTH_SECRET` | sim | chave aleatória com **mínimo 32 caracteres** |
| `CRON_SECRET` | recomendado | segredo para proteger `/api/cron/audit-check` (Vercel envia `Authorization: Bearer <secret>`) |
| `DATABASE_POOL_MAX` | não | tamanho do pool (default `10`) |
| `NODE_ENV` | automático | `production` (definido pela Vercel) |

> **Nunca defina `PGLITE_DATA_DIR` em produção** — a presença de `DATABASE_URL`
> força o uso do PostgreSQL externo e desativa o PGlite local.

## 2. Banco de dados (PostgreSQL 16+)

Pré-requisitos no banco:

```sql
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists btree_gist;
create role clinicos_app login password '...' nosuperuser nobypassrls;
```

Aplicar as 17 migrations + seed (executar localmente apontando para o banco de produção):

```bash
DATABASE_URL=postgresql://... npm run db:setup-pg
# ou, manualmente:
DATABASE_URL=postgresql://... node tools/apply-migrations-pg.mjs --seed
```

O runner `apply-migrations-pg.mjs` aplica os arquivos em `db/migrations/*.sql` em ordem alfabética e, com `--seed`, carrega `db/dev-seed.sql` (dados de demonstração) apenas se a tabela `users` estiver vazia. Use `--force-seed` para forçar.

Validação:

```bash
DATABASE_URL=postgresql://... npm run db:check
DATABASE_URL=postgresql://... npm run rls:check
```

## 3. Build

O `vercel.json` já define:

- `framework`: `nextjs`
- `buildCommand`: `npm run build`
- `installCommand`: `npm install`
- `regions`: `gru1` (São Paulo)
- `functions.maxDuration`: 60s para rotas e server actions

As dependências nativas (`@node-rs/argon2`, `pg`) estão em `serverExternalPackages`
no `next.config.ts`.

## 4. Pós-deploy

- Acessar `/login` com as contas de demonstração (senha `Clinicos@2026`) ou criar a primeira clínica via `/admin/clientes/novo`.
- Verificar `/api/health` (deve retornar `{"status":"ok"}`).
- Confirmar isolamento multi-tenant: `npm run rls:check` (local) e testes manuais com duas clínicas.

## 5. Observações

- O PGlite (`.data/clinicos`) é **apenas para desenvolvimento local** e nunca deve
  ser usado em produção.
- Migrations são idempotentes (`create table if not exists`, `insert ... on conflict`).
- A role `clinicos_app` não tem `BYPASSRLS`; o isolamento é aplicado por RLS.
