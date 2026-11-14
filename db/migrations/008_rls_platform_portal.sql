-- =============================================================================
-- ClinicOS · 008 · RLS: plataforma, catálogos globais e Portal do Paciente
-- =============================================================================

-- Organizações -----------------------------------------------------------------
alter table clinics enable row level security;
create policy clinics_select_member on clinics
  for select using (app_is_platform_admin() or app_is_member_of_clinic(id));
create policy clinics_select_portal on clinics
  for select using (exists (
    select 1 from patient_portal_access a
    where a.clinic_id = clinics.id and a.user_id = app_current_user_id() and a.status = 'ativo'
  ));
create policy clinics_update_admin on clinics
  for update using (app_has_any_role(id, array['clinic_admin']))
  with check (app_has_any_role(id, array['clinic_admin']));
create policy clinics_platform_write on clinics
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

-- Usuários ---------------------------------------------------------------------
alter table users enable row level security;
create policy users_select_self on users
  for select using (id = app_current_user_id());
create policy users_select_admin on users
  for select using (app_shares_clinic_with_user(id));
create policy users_update_self on users
  for update using (id = app_current_user_id())
  with check (id = app_current_user_id());
create policy users_platform_all on users
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

alter table platform_admins enable row level security;
create policy platform_admins_platform_all on platform_admins
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

-- Vínculos e convites ----------------------------------------------------------
alter table clinic_memberships enable row level security;
create policy memberships_select on clinic_memberships
  for select using (
    user_id = app_current_user_id()
    or app_has_any_role(clinic_id, array['clinic_admin'])
  );
create policy memberships_insert on clinic_memberships
  for insert with check (app_has_any_role(clinic_id, array['clinic_admin']));
create policy memberships_update on clinic_memberships
  for update using (app_has_any_role(clinic_id, array['clinic_admin']))
  with check (app_has_any_role(clinic_id, array['clinic_admin']));
create policy memberships_delete on clinic_memberships
  for delete using (app_has_any_role(clinic_id, array['clinic_admin']));

alter table user_invites enable row level security;
create policy user_invites_admin_all on user_invites
  for all using (app_has_any_role(clinic_id, array['clinic_admin']))
  with check (app_has_any_role(clinic_id, array['clinic_admin']));

alter table patient_portal_access enable row level security;
create policy portal_access_select on patient_portal_access
  for select using (
    (user_id = app_current_user_id() and status = 'ativo')
    or app_has_any_role(clinic_id, array['clinic_admin'])
  );
create policy portal_access_admin_write on patient_portal_access
  for all using (app_has_any_role(clinic_id, array['clinic_admin']))
  with check (app_has_any_role(clinic_id, array['clinic_admin']));

-- Notificações -----------------------------------------------------------------
alter table notifications enable row level security;
create policy notifications_select_own on notifications
  for select using (user_id = app_current_user_id());
create policy notifications_update_own on notifications
  for update using (user_id = app_current_user_id())
  with check (user_id = app_current_user_id());
create policy notifications_insert_own on notifications
  for insert with check (user_id = app_current_user_id());
create policy notifications_delete_own on notifications
  for delete using (user_id = app_current_user_id());

-- IA ---------------------------------------------------------------------------
alter table ai_interactions enable row level security;
create policy ai_select_own on ai_interactions
  for select using (
    user_id = app_current_user_id()
    or app_has_any_role(clinic_id, array['clinic_admin'])
  );
create policy ai_insert_own on ai_interactions
  for insert with check (
    user_id = app_current_user_id()
    and app_has_any_role(clinic_id, array['clinic_admin','doctor','receptionist','finance'])
  );

-- Assinaturas e entitlements ---------------------------------------------------
alter table subscriptions enable row level security;
create policy subscriptions_select on subscriptions
  for select using (
    app_has_any_role(clinic_id, array['clinic_admin','finance'])
    or app_is_platform_admin()
  );
create policy subscriptions_platform_write on subscriptions
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

alter table subscription_invoices enable row level security;
create policy invoices_select on subscription_invoices
  for select using (
    app_has_any_role(clinic_id, array['clinic_admin','finance'])
    or app_is_platform_admin()
  );
create policy invoices_platform_write on subscription_invoices
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

alter table clinic_modules enable row level security;
create policy clinic_modules_select on clinic_modules
  for select using (app_is_member_of_clinic(clinic_id) or app_is_platform_admin());
create policy clinic_modules_platform_write on clinic_modules
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

alter table clinic_features enable row level security;
create policy clinic_features_select on clinic_features
  for select using (app_is_member_of_clinic(clinic_id) or app_is_platform_admin());
create policy clinic_features_platform_write on clinic_features
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

alter table gateway_events enable row level security;
create policy gateway_events_platform_all on gateway_events
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

-- Catálogos globais ------------------------------------------------------------
alter table financial_categories enable row level security;
create policy financial_categories_select on financial_categories
  for select using (
    (clinic_id is null and app_current_user_id() is not null)
    or app_has_any_role(clinic_id, array['clinic_admin','finance'])
  );
create policy financial_categories_insert on financial_categories
  for insert with check (
    (clinic_id is null and app_is_platform_admin())
    or app_has_any_role(clinic_id, array['clinic_admin','finance'])
  );
create policy financial_categories_update on financial_categories
  for update using (
    (clinic_id is null and app_is_platform_admin())
    or app_has_any_role(clinic_id, array['clinic_admin','finance'])
  ) with check (
    (clinic_id is null and app_is_platform_admin())
    or app_has_any_role(clinic_id, array['clinic_admin','finance'])
  );
create policy financial_categories_delete on financial_categories
  for delete using (
    (clinic_id is null and app_is_platform_admin())
    or app_has_any_role(clinic_id, array['clinic_admin'])
  );

alter table medications enable row level security;
create policy medications_select on medications
  for select using (
    clinic_id is null
    or app_is_member_of_clinic(clinic_id)
  );
create policy medications_write on medications
  for all using (
    (clinic_id is null and app_is_platform_admin())
    or app_has_any_role(clinic_id, array['clinic_admin','doctor'])
  ) with check (
    (clinic_id is null and app_is_platform_admin())
    or app_has_any_role(clinic_id, array['clinic_admin','doctor'])
  );

alter table exam_catalog enable row level security;
create policy exam_catalog_select on exam_catalog
  for select using (
    clinic_id is null
    or app_is_member_of_clinic(clinic_id)
  );
create policy exam_catalog_write on exam_catalog
  for all using (
    (clinic_id is null and app_is_platform_admin())
    or app_has_any_role(clinic_id, array['clinic_admin','doctor'])
  ) with check (
    (clinic_id is null and app_is_platform_admin())
    or app_has_any_role(clinic_id, array['clinic_admin','doctor'])
  );

alter table insurance_providers enable row level security;
create policy insurance_providers_select on insurance_providers
  for select using (app_current_user_id() is not null);
create policy insurance_providers_platform_write on insurance_providers
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

-- Catálogo da plataforma (leitura autenticada; escrita do superadministrador) ---
alter table plans enable row level security;
create policy plans_select on plans for select using (app_current_user_id() is not null);
create policy plans_platform_write on plans for all using (app_is_platform_admin()) with check (app_is_platform_admin());

alter table modules enable row level security;
create policy modules_select on modules for select using (app_current_user_id() is not null);
create policy modules_platform_write on modules for all using (app_is_platform_admin()) with check (app_is_platform_admin());

alter table module_features enable row level security;
create policy module_features_select on module_features for select using (app_current_user_id() is not null);
create policy module_features_platform_write on module_features for all using (app_is_platform_admin()) with check (app_is_platform_admin());

alter table plan_modules enable row level security;
create policy plan_modules_select on plan_modules for select using (app_current_user_id() is not null);
create policy plan_modules_platform_write on plan_modules for all using (app_is_platform_admin()) with check (app_is_platform_admin());

alter table permissions enable row level security;
create policy permissions_select on permissions for select using (app_current_user_id() is not null);
create policy permissions_platform_write on permissions for all using (app_is_platform_admin()) with check (app_is_platform_admin());

alter table role_permissions enable row level security;
create policy role_permissions_select on role_permissions for select using (app_current_user_id() is not null);
create policy role_permissions_platform_write on role_permissions for all using (app_is_platform_admin()) with check (app_is_platform_admin());

alter table platform_settings enable row level security;
create policy platform_settings_platform_all on platform_settings
  for all using (app_is_platform_admin()) with check (app_is_platform_admin());

-- Auditoria (somente leitura; escrita exclusivamente por triggers) -------------
alter table audit_logs enable row level security;
create policy audit_logs_select on audit_logs
  for select using (
    app_has_any_role(clinic_id, array['clinic_admin'])
    or (clinic_id is null and app_is_platform_admin())
  );

alter table record_access_logs enable row level security;
create policy record_access_select on record_access_logs
  for select using (app_has_any_role(clinic_id, array['clinic_admin']));
create policy record_access_insert on record_access_logs
  for insert with check (
    user_id = app_current_user_id()
    and app_has_any_role(clinic_id, array['clinic_admin','doctor'])
  );

-- Portal do Paciente: acesso somente aos próprios registros -------------------
create policy patients_portal_select on patients
  for select using (app_owns_patient(id));

create policy appointments_portal_select on appointments
  for select using (app_owns_patient(patient_id));

create policy prescriptions_portal_select on prescriptions
  for select using (app_owns_patient(patient_id));

create policy prescription_items_portal_select on prescription_items
  for select using (exists (
    select 1 from prescriptions p
    where p.id = prescription_items.prescription_id
      and app_owns_patient(p.patient_id)
  ));

create policy exam_orders_portal_select on exam_orders
  for select using (app_owns_patient(patient_id));

create policy exam_order_items_portal_select on exam_order_items
  for select using (exists (
    select 1 from exam_orders o
    where o.id = exam_order_items.exam_order_id
      and app_owns_patient(o.patient_id)
  ));

create policy exam_results_portal_select on exam_results
  for select using (
    status = 'liberado'
    and exists (
      select 1 from exam_orders o
      where o.id = exam_results.exam_order_id
        and app_owns_patient(o.patient_id)
    )
  );

create policy documents_portal_select on documents
  for select using (app_owns_patient(patient_id));

create policy patient_consents_portal_select on patient_consents
  for select using (app_owns_patient(patient_id));

create policy professionals_portal_select on professionals
  for select using (exists (
    select 1 from patient_portal_access a
    where a.clinic_id = professionals.clinic_id
      and a.user_id = app_current_user_id()
      and a.status = 'ativo'
  ));

create policy clinic_units_portal_select on clinic_units
  for select using (exists (
    select 1 from patient_portal_access a
    where a.clinic_id = clinic_units.clinic_id
      and a.user_id = app_current_user_id()
      and a.status = 'ativo'
  ));
