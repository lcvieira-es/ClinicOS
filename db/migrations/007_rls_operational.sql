-- =============================================================================
-- ClinicOS · 007 · Row Level Security: tabelas operacionais e dados clínicos
-- =============================================================================
-- Estratégia: banco único, schema compartilhado, discriminador clinic_id.
-- O backend sempre define app.user_id e app.clinic_id na transação.
-- O papel de runtime NÃO é owner das tabelas; portanto a RLS é aplicada.
-- Funções SECURITY DEFINER (owner) consultam vínculos sem recursão.
-- =============================================================================

-- Tabelas genéricas: leitura por papéis, escrita por papéis, exclusão por papéis
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('clinic_units',              array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin'],                          array['clinic_admin']),
      ('membership_units',          array['clinic_admin'],                                     array['clinic_admin'],                          array['clinic_admin']),
      ('professionals',             array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin'],                          array['clinic_admin']),
      ('professional_units',        array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin'],                          array['clinic_admin']),
      ('professional_schedules',    array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin','receptionist'],           array['clinic_admin','receptionist']),
      ('schedule_blocks',           array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin','receptionist'],           array['clinic_admin','receptionist']),
      ('clinic_insurance_contracts',array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin','finance'],                array['clinic_admin']),
      ('patients',                  array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin','receptionist','doctor'],  array['clinic_admin']),
      ('patient_consents',          array['clinic_admin','doctor','receptionist'],            array['clinic_admin','receptionist'],           array['clinic_admin']),
      ('appointments',              array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin','receptionist','doctor'],  array['clinic_admin']),
      ('appointment_status_history',array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin']),
      ('waiting_list',              array['clinic_admin','doctor','receptionist'],            array['clinic_admin','receptionist'],           array['clinic_admin','receptionist']),
      ('allergies',                 array['clinic_admin','doctor','receptionist'],            array['clinic_admin','doctor'],                 array['clinic_admin','doctor']),
      ('exam_orders',               array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin','doctor','receptionist'],  array['clinic_admin']),
      ('exam_order_items',          array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin','doctor','receptionist'],  array['clinic_admin']),
      ('exam_results',              array['clinic_admin','doctor','receptionist'],            array['clinic_admin','doctor'],                 array['clinic_admin']),
      ('insurance_claims',          array['clinic_admin','finance','receptionist'],           array['clinic_admin','finance'],                array['clinic_admin']),
      ('financial_transactions',    array['clinic_admin','finance'],                          array['clinic_admin','finance'],                array['clinic_admin']),
      ('inventory_items',           array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin','finance'],                array['clinic_admin']),
      ('inventory_movements',       array['clinic_admin','doctor','receptionist','finance'], array['clinic_admin','finance'],                array['clinic_admin']),
      ('documents',                 array['clinic_admin','doctor','receptionist'],            array['clinic_admin','doctor','receptionist'],  array['clinic_admin']),
      ('whatsapp_messages',         array['clinic_admin','doctor','receptionist'],            array['clinic_admin','doctor','receptionist'],  array['clinic_admin'])
    ) as t(tbl, read_roles, write_roles, delete_roles)
  loop
    execute format('alter table %I enable row level security', r.tbl);
    execute format('drop policy if exists tenant_select on %I', r.tbl);
    execute format('drop policy if exists tenant_insert on %I', r.tbl);
    execute format('drop policy if exists tenant_update on %I', r.tbl);
    execute format('drop policy if exists tenant_delete on %I', r.tbl);

    execute format(
      'create policy tenant_select on %I for select using (app_has_any_role(clinic_id, %L::text[]))',
      r.tbl, r.read_roles
    );
    execute format(
      'create policy tenant_insert on %I for insert with check (app_has_any_role(clinic_id, %L::text[]))',
      r.tbl, r.write_roles
    );
    execute format(
      'create policy tenant_update on %I for update using (app_has_any_role(clinic_id, %L::text[])) with check (app_has_any_role(clinic_id, %L::text[]))',
      r.tbl, r.write_roles, r.write_roles
    );
    execute format(
      'create policy tenant_delete on %I for delete using (app_has_any_role(clinic_id, %L::text[]))',
      r.tbl, r.delete_roles
    );
  end loop;
end $$;

-- Prontuário: somente admin clínico e médicos; escrita restrita ao profissional --
alter table medical_records enable row level security;
create policy medical_records_select on medical_records
  for select using (app_has_any_role(clinic_id, array['clinic_admin','doctor']));
create policy medical_records_insert on medical_records
  for insert with check (
    app_has_any_role(clinic_id, array['clinic_admin'])
    or (app_has_any_role(clinic_id, array['doctor']) and professional_id = app_professional_id(clinic_id))
  );
create policy medical_records_update on medical_records
  for update using (
    app_has_any_role(clinic_id, array['clinic_admin'])
    or (app_has_any_role(clinic_id, array['doctor']) and professional_id = app_professional_id(clinic_id))
  ) with check (
    app_has_any_role(clinic_id, array['clinic_admin'])
    or (app_has_any_role(clinic_id, array['doctor']) and professional_id = app_professional_id(clinic_id))
  );
create policy medical_records_delete on medical_records
  for delete using (app_has_any_role(clinic_id, array['clinic_admin']));

-- Notas clínicas: mesma regra do prontuário -----------------------------------
alter table clinical_notes enable row level security;
create policy clinical_notes_select on clinical_notes
  for select using (app_has_any_role(clinic_id, array['clinic_admin','doctor']));
create policy clinical_notes_insert on clinical_notes
  for insert with check (
    app_has_any_role(clinic_id, array['clinic_admin'])
    or (app_has_any_role(clinic_id, array['doctor']) and professional_id = app_professional_id(clinic_id))
  );
create policy clinical_notes_update on clinical_notes
  for update using (
    app_has_any_role(clinic_id, array['clinic_admin'])
    or (app_has_any_role(clinic_id, array['doctor']) and professional_id = app_professional_id(clinic_id))
  ) with check (
    app_has_any_role(clinic_id, array['clinic_admin'])
    or (app_has_any_role(clinic_id, array['doctor']) and professional_id = app_professional_id(clinic_id))
  );
create policy clinical_notes_delete on clinical_notes
  for delete using (app_has_any_role(clinic_id, array['clinic_admin']));

-- Prescrições: leitura pela equipe, emissão pelo médico responsável -----------
alter table prescriptions enable row level security;
create policy prescriptions_select on prescriptions
  for select using (app_has_any_role(clinic_id, array['clinic_admin','doctor','receptionist','finance']));
create policy prescriptions_insert on prescriptions
  for insert with check (
    app_has_any_role(clinic_id, array['clinic_admin'])
    or (app_has_any_role(clinic_id, array['doctor']) and professional_id = app_professional_id(clinic_id))
  );
create policy prescriptions_update on prescriptions
  for update using (
    app_has_any_role(clinic_id, array['clinic_admin'])
    or (app_has_any_role(clinic_id, array['doctor']) and professional_id = app_professional_id(clinic_id))
  ) with check (
    app_has_any_role(clinic_id, array['clinic_admin'])
    or (app_has_any_role(clinic_id, array['doctor']) and professional_id = app_professional_id(clinic_id))
  );
create policy prescriptions_delete on prescriptions
  for delete using (app_has_any_role(clinic_id, array['clinic_admin']));

alter table prescription_items enable row level security;
create policy prescription_items_select on prescription_items
  for select using (app_has_any_role(clinic_id, array['clinic_admin','doctor','receptionist','finance']));
create policy prescription_items_write on prescription_items
  for all using (
    app_has_any_role(clinic_id, array['clinic_admin'])
    or exists (
      select 1 from prescriptions p
      where p.id = prescription_items.prescription_id
        and p.clinic_id = prescription_items.clinic_id
        and app_has_any_role(p.clinic_id, array['doctor'])
        and p.professional_id = app_professional_id(p.clinic_id)
    )
  ) with check (
    app_has_any_role(clinic_id, array['clinic_admin'])
    or exists (
      select 1 from prescriptions p
      where p.id = prescription_items.prescription_id
        and p.clinic_id = prescription_items.clinic_id
        and app_has_any_role(p.clinic_id, array['doctor'])
        and p.professional_id = app_professional_id(p.clinic_id)
    )
  );
