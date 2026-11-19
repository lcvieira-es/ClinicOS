-- =============================================================================
-- ClinicOS · 010 · Grantes do papel de runtime
-- =============================================================================
-- Em produção:
--   create role clinicos_app login password '...' nosuperuser nobypassrls;
-- O owner das tabelas (migrações) ignora a RLS; o runtime NÃO.
-- =============================================================================

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'clinicos_app') then
    grant usage on schema public to clinicos_app;
    grant select, insert, update, delete on all tables in schema public to clinicos_app;
    grant usage, select on all sequences in schema public to clinicos_app;
    grant execute on all functions in schema public to clinicos_app;
  end if;
end $$;
