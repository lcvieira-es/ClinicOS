# Banco de dados

## Pré-requisitos de produção

PostgreSQL 16+ com:

```sql
create extension if not exists pgcrypto;   -- opcional: gen_random_uuid é nativo no PG13+
create extension if not exists pg_trgm;    -- busca textual
create extension if not exists btree_gist; -- constraint de não sobreposição da agenda
```

As migrations toleram ambientes sem `pg_trgm`/`btree_gist`, mas **produção deve tê-las**.

## Aplicação

Execute em ordem alfabética:

```bash
for f in db/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

Ou use o runner de validação local:

```bash
npm run db:check
npm run rls:check
```

## Papéis

- **Owner das migrations:** aplica DDL, é dono das tabelas e ignora RLS (não use em runtime).
- **`clinicos_app`:** papel de runtime, sem `BYPASSRLS`, com DML apenas. Crie antes de aplicar `010_grants.sql`:

```sql
create role clinicos_app login password '...' nosuperuser nobypassrls;
```

## Contexto por transação

Todo request autenticado deve abrir uma transação e definir:

```sql
select set_config('app.user_id', '<uuid>', true);
select set_config('app.clinic_id', '<uuid>', true);
```

Sem essas variáveis, as policies de tenant não liberam acesso. Nunca aceite `clinic_id` do cliente.

## Auditoria

```sql
select * from fn_verify_audit_chain('<clinic_id>');
```

Retorna `checked`, `chain_valid` e `broken_at`.
