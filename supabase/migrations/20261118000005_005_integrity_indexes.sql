-- =============================================================================
-- ClinicOS · 005 · Integridade multi-tenant, índices e triggers de atualização
-- =============================================================================

-- Chaves candidatas (id, clinic_id) para FKs compostas ------------------------
alter table clinic_units          add constraint clinic_units_id_clinic_uk unique (id, clinic_id);
alter table clinic_memberships    add constraint clinic_memberships_id_clinic_uk unique (id, clinic_id);
alter table professionals         add constraint professionals_id_clinic_uk unique (id, clinic_id);
alter table patients              add constraint patients_id_clinic_uk unique (id, clinic_id);
alter table appointments          add constraint appointments_id_clinic_uk unique (id, clinic_id);
alter table medical_records       add constraint medical_records_id_clinic_uk unique (id, clinic_id);
alter table prescriptions         add constraint prescriptions_id_clinic_uk unique (id, clinic_id);
alter table exam_orders           add constraint exam_orders_id_clinic_uk unique (id, clinic_id);
alter table exam_order_items      add constraint exam_order_items_id_clinic_uk unique (id, clinic_id);
alter table insurance_claims      add constraint insurance_claims_id_clinic_uk unique (id, clinic_id);
alter table inventory_items       add constraint inventory_items_id_clinic_uk unique (id, clinic_id);
alter table subscriptions         add constraint subscriptions_id_clinic_uk unique (id, clinic_id);

-- FKs compostas: impede mistura de dados entre clínicas ------------------------
alter table membership_units
  add constraint membership_units_membership_fk
  foreign key (membership_id, clinic_id) references clinic_memberships (id, clinic_id) on delete cascade;
alter table membership_units
  add constraint membership_units_unit_fk
  foreign key (unit_id, clinic_id) references clinic_units (id, clinic_id) on delete cascade;

alter table professional_units
  add constraint professional_units_professional_fk
  foreign key (professional_id, clinic_id) references professionals (id, clinic_id) on delete cascade;
alter table professional_units
  add constraint professional_units_unit_fk
  foreign key (unit_id, clinic_id) references clinic_units (id, clinic_id) on delete cascade;

alter table professional_schedules
  add constraint professional_schedules_professional_fk
  foreign key (professional_id, clinic_id) references professionals (id, clinic_id) on delete cascade;

alter table appointments
  add constraint appointments_unit_fk
  foreign key (unit_id, clinic_id) references clinic_units (id, clinic_id) on delete restrict;
alter table appointments
  add constraint appointments_patient_fk
  foreign key (patient_id, clinic_id) references patients (id, clinic_id) on delete restrict;
alter table appointments
  add constraint appointments_professional_fk
  foreign key (professional_id, clinic_id) references professionals (id, clinic_id) on delete restrict;

alter table appointment_status_history
  add constraint appointment_history_appointment_fk
  foreign key (appointment_id, clinic_id) references appointments (id, clinic_id) on delete cascade;

alter table medical_records
  add constraint medical_records_patient_fk
  foreign key (patient_id, clinic_id) references patients (id, clinic_id) on delete restrict;
alter table medical_records
  add constraint medical_records_professional_fk
  foreign key (professional_id, clinic_id) references professionals (id, clinic_id) on delete restrict;

alter table clinical_notes
  add constraint clinical_notes_record_fk
  foreign key (medical_record_id, clinic_id) references medical_records (id, clinic_id) on delete cascade;

alter table prescriptions
  add constraint prescriptions_patient_fk
  foreign key (patient_id, clinic_id) references patients (id, clinic_id) on delete restrict;
alter table prescriptions
  add constraint prescriptions_professional_fk
  foreign key (professional_id, clinic_id) references professionals (id, clinic_id) on delete restrict;

alter table prescription_items
  add constraint prescription_items_prescription_fk
  foreign key (prescription_id, clinic_id) references prescriptions (id, clinic_id) on delete cascade;

alter table exam_orders
  add constraint exam_orders_patient_fk
  foreign key (patient_id, clinic_id) references patients (id, clinic_id) on delete restrict;
alter table exam_orders
  add constraint exam_orders_professional_fk
  foreign key (professional_id, clinic_id) references professionals (id, clinic_id) on delete restrict;

alter table exam_order_items
  add constraint exam_order_items_order_fk
  foreign key (exam_order_id, clinic_id) references exam_orders (id, clinic_id) on delete cascade;

alter table exam_results
  add constraint exam_results_order_fk
  foreign key (exam_order_id, clinic_id) references exam_orders (id, clinic_id) on delete cascade;

alter table insurance_claims
  add constraint insurance_claims_patient_fk
  foreign key (patient_id, clinic_id) references patients (id, clinic_id) on delete restrict;

alter table financial_transactions
  add constraint financial_transactions_patient_fk
  foreign key (patient_id, clinic_id) references patients (id, clinic_id) on delete restrict;

alter table inventory_movements
  add constraint inventory_movements_item_fk
  foreign key (item_id, clinic_id) references inventory_items (id, clinic_id) on delete cascade;

alter table documents
  add constraint documents_patient_fk
  foreign key (patient_id, clinic_id) references patients (id, clinic_id) on delete restrict;

alter table subscription_invoices
  add constraint subscription_invoices_subscription_fk
  foreign key (subscription_id, clinic_id) references subscriptions (id, clinic_id) on delete cascade;

-- Índices de tenant ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'clinic_units', 'clinic_memberships', 'membership_units', 'user_invites',
    'professionals', 'professional_units', 'professional_schedules', 'schedule_blocks',
    'clinic_insurance_contracts', 'patients', 'patient_portal_access', 'patient_consents',
    'appointments', 'appointment_status_history', 'waiting_list',
    'medical_records', 'clinical_notes', 'allergies', 'medications',
    'prescriptions', 'prescription_items', 'exam_catalog', 'exam_orders',
    'exam_order_items', 'exam_results', 'financial_categories', 'insurance_claims',
    'financial_transactions', 'inventory_items', 'inventory_movements', 'documents',
    'notifications', 'whatsapp_messages', 'ai_interactions', 'subscriptions',
    'subscription_invoices', 'clinic_modules', 'clinic_features', 'record_access_logs'
  ]
  loop
    execute format('create index if not exists %I on %I (clinic_id)', t || '_clinic_idx', t);
  end loop;
end $$;

create index if not exists appointments_start_idx on appointments (clinic_id, scheduled_start);
create index if not exists appointments_professional_idx on appointments (professional_id, scheduled_start);
create index if not exists appointments_patient_idx on appointments (patient_id, scheduled_start);
create index if not exists appointments_status_idx on appointments (clinic_id, status);
create index if not exists prescriptions_issued_idx on prescriptions (clinic_id, issued_at desc);
create index if not exists exam_orders_status_idx on exam_orders (clinic_id, status);
create index if not exists financial_due_idx on financial_transactions (clinic_id, due_date);
create index if not exists financial_status_idx on financial_transactions (clinic_id, status);
create index if not exists patients_phone_idx on patients (clinic_id, phone);
create index if not exists notifications_user_idx on notifications (user_id, read_at);
create index if not exists whatsapp_status_idx on whatsapp_messages (clinic_id, status);

-- Impede dupla marcação do mesmo profissional no mesmo horário -----------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'btree_gist') then
    alter table appointments
      add constraint appointments_professional_no_overlap
      exclude using gist (
        professional_id with =,
        tstzrange(scheduled_start, scheduled_end, '[)') with &&
      ) where (status not in ('cancelada', 'faltou'));
  else
    raise notice 'btree_gist indisponível: constraint de não sobreposição não criada.';
  end if;
end $$;

-- updated_at automático -------------------------------------------------------
create or replace function fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'plans', 'modules', 'clinics', 'clinic_units', 'clinic_memberships',
    'professionals', 'patients', 'appointments', 'medical_records', 'clinical_notes',
    'allergies', 'medications', 'prescriptions', 'exam_catalog', 'exam_orders',
    'exam_results', 'insurance_providers', 'clinic_insurance_contracts',
    'insurance_claims', 'financial_transactions', 'inventory_items',
    'subscriptions', 'subscription_invoices'
  ]
  loop
    execute format(
      'create trigger trg_%I_updated_at before update on %I for each row execute function fn_set_updated_at()',
      t, t
    );
  end loop;
end $$;
