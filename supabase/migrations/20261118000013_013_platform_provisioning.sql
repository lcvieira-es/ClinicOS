-- =============================================================================
-- ClinicOS · 013 · Provisão de contas pela plataforma (somente escrita da conta)
-- =============================================================================
-- O superadministrador não acessa dados clínicos por padrão. Esta migração
-- concede ao papel de plataforma apenas a escrita nos registros de CONTA
-- necessários para provisionar uma clínica contratada:
--   · clinic_units       (matriz e unidades cadastráveis pela plataforma)
--   · clinic_memberships (vínculo inicial de administrador da clínica)
--   · membership_units   (vínculo entre adesão e unidade)
--   · user_invites       (convites de administrador no onboarding)
-- Nenhuma delas contém dado clínico. Nenhum direito de leitura/escrita sobre
-- pacientes, prontuários, receitas, laudos ou financeiro é concedido aqui.
-- =============================================================================

create policy clinic_units_platform_write on clinic_units
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

create policy memberships_platform_write on clinic_memberships
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

create policy membership_units_platform_write on membership_units
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

create policy user_invites_platform_write on user_invites
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());
