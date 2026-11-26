-- =============================================================================
-- ClinicOS · 019 · Adiciona coluna notes em medical_records
-- =============================================================================
alter table medical_records
  add column if not exists notes text;

-- Registra a migration no controle de versão (idempotente).
insert into schema_migrations (version) values ('019_medical_records_notes')
on conflict (version) do nothing;
