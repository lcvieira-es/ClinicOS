-- =============================================================================
-- ClinicOS · 019 · Adiciona coluna notes em medical_records
-- =============================================================================
alter table medical_records
  add column if not exists notes text;
