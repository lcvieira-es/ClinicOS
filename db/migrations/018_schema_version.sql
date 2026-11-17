-- =============================================================================
-- ClinicOS · 018 · Controle de versão do schema (schema_migrations)
-- =============================================================================
-- Rastreia quais migrations foram aplicadas, permitindo que /api/health reporte
-- a versão do schema e que auditorias detectem drift entre código e banco.

create table if not exists schema_migrations (
  version     text primary key,
  applied_at  timestamptz not null default now()
);

-- Registra todas as migrations conhecidas (idempotente).
insert into schema_migrations (version) values
  ('001_extensions_enums'),
  ('002_platform_tenant'),
  ('003_clinical'),
  ('004_financial_ops'),
  ('005_integrity_indexes'),
  ('006_rls_helpers'),
  ('007_rls_operational'),
  ('008_rls_platform_portal'),
  ('009_audit'),
  ('010_grants'),
  ('011_seed_catalog'),
  ('012_permissions'),
  ('013_platform_provisioning'),
  ('014_clinic_operations'),
  ('015_invite_status'),
  ('016_public_verification'),
  ('017_rename_clientes_to_clinicas'),
  ('018_schema_version')
on conflict (version) do nothing;
