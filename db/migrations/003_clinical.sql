-- =============================================================================
-- ClinicOS · 003 · Agenda, atendimento e documentação clínica
-- =============================================================================

create table appointments (
  id                    uuid primary key default gen_random_uuid(),
  clinic_id             uuid not null references clinics(id) on delete cascade,
  unit_id               uuid not null references clinic_units(id) on delete restrict,
  patient_id            uuid not null references patients(id) on delete restrict,
  professional_id       uuid not null references professionals(id) on delete restrict,
  type                  appointment_type not null default 'consulta',
  status                appointment_status not null default 'agendada',
  scheduled_start       timestamptz not null,
  scheduled_end         timestamptz not null,
  checked_in_at         timestamptz,
  started_at            timestamptz,
  finished_at           timestamptz,
  payment_method        payment_method not null default 'particular',
  amount                numeric(12,2) not null default 0 check (amount >= 0),
  insurance_provider_id uuid references insurance_providers(id) on delete set null,
  notes                 text,
  cancellation_reason   text,
  cancelled_by          uuid references users(id) on delete set null,
  rescheduled_from_id   uuid references appointments(id) on delete set null,
  created_by            uuid references users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint appointments_range_check check (scheduled_end > scheduled_start)
);

create table appointment_status_history (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null references clinics(id) on delete cascade,
  appointment_id uuid not null references appointments(id) on delete cascade,
  from_status    appointment_status,
  to_status      appointment_status not null,
  changed_by     uuid references users(id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now()
);

create table waiting_list (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics(id) on delete cascade,
  unit_id         uuid not null references clinic_units(id) on delete cascade,
  patient_id      uuid not null references patients(id) on delete cascade,
  professional_id uuid references professionals(id) on delete set null,
  priority        smallint not null default 3 check (priority between 1 and 5),
  desired_from    timestamptz,
  desired_to      timestamptz,
  notes           text,
  status          text not null default 'aguardando'
                  check (status in ('aguardando', 'contatado', 'agendado', 'cancelado')),
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Prontuário ------------------------------------------------------------------
create table medical_records (
  id                    uuid primary key default gen_random_uuid(),
  clinic_id             uuid not null references clinics(id) on delete cascade,
  patient_id            uuid not null references patients(id) on delete restrict,
  professional_id       uuid not null references professionals(id) on delete restrict,
  appointment_id        uuid references appointments(id) on delete set null,
  record_date           timestamptz not null default now(),
  chief_complaint       text,
  history_present_illness text,
  physical_exam         text,
  assessment            text,
  plan                  text,
  icd10_codes           text[] not null default '{}',
  status                medical_record_status not null default 'rascunho',
  version               integer not null default 1 check (version > 0),
  parent_id             uuid references medical_records(id) on delete set null,
  signed_at             timestamptz,
  signed_by             uuid references users(id) on delete set null,
  signature_method      signature_method,
  content_hash          text,
  signature_hash        text,
  verification_code     text unique,
  created_by            uuid references users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create unique index medical_records_appointment_uidx
  on medical_records (appointment_id) where appointment_id is not null;

create table clinical_notes (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references clinics(id) on delete cascade,
  medical_record_id uuid not null references medical_records(id) on delete cascade,
  patient_id        uuid not null references patients(id) on delete restrict,
  professional_id   uuid not null references professionals(id) on delete restrict,
  note_type         clinical_note_type not null default 'evolucao',
  content           text not null,
  status            clinical_note_status not null default 'rascunho',
  parent_note_id    uuid references clinical_notes(id) on delete set null,
  signed_at         timestamptz,
  signed_by         uuid references users(id) on delete set null,
  signature_method  signature_method,
  content_hash      text,
  created_by        uuid references users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table allergies (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics(id) on delete cascade,
  patient_id  uuid not null references patients(id) on delete cascade,
  substance   text not null,
  reaction    text,
  severity    allergy_severity not null default 'moderada',
  notes       text,
  status      text not null default 'ativo' check (status in ('ativo', 'inativo')),
  noted_by    uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Medicamentos: linha global (clinic_id nulo) ou customizada da clínica --------
create table medications (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid references clinics(id) on delete cascade,
  name              text not null,
  active_ingredient text,
  presentation      text,
  controlled_class  text,
  anvisa_code       text,
  default_dosage    text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    create index if not exists medications_name_trgm_idx on medications using gin (name gin_trgm_ops);
  else
    create index if not exists medications_name_idx on medications (name);
  end if;
end $$;

create table prescriptions (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references clinics(id) on delete cascade,
  patient_id        uuid not null references patients(id) on delete restrict,
  professional_id   uuid not null references professionals(id) on delete restrict,
  appointment_id    uuid references appointments(id) on delete set null,
  medical_record_id uuid references medical_records(id) on delete set null,
  type              prescription_type not null default 'simples',
  status            prescription_status not null default 'rascunho',
  issued_at         timestamptz,
  verification_code text unique,
  notes             text,
  content_hash      text,
  signature_hash    text,
  signature_method  signature_method,
  signed_at         timestamptz,
  signed_by         uuid references users(id) on delete set null,
  pdf_url           text,
  created_by        uuid references users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table prescription_items (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics(id) on delete cascade,
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  medication_id   uuid references medications(id) on delete set null,
  medication_name text not null,
  dose            text,
  frequency       text,
  duration        text,
  route           text,
  quantity        numeric(12,3),
  instructions    text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

-- Exames ----------------------------------------------------------------------
create table exam_catalog (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid references clinics(id) on delete cascade,
  tuss_code       text,
  name            text not null,
  exam_type       text,
  sample_type     text,
  preparation     text,
  reference_price numeric(12,2) check (reference_price is null or reference_price >= 0),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    create index if not exists exam_catalog_name_trgm_idx on exam_catalog using gin (name gin_trgm_ops);
  else
    create index if not exists exam_catalog_name_idx on exam_catalog (name);
  end if;
end $$;

create table exam_orders (
  id                  uuid primary key default gen_random_uuid(),
  clinic_id           uuid not null references clinics(id) on delete cascade,
  patient_id          uuid not null references patients(id) on delete restrict,
  professional_id     uuid not null references professionals(id) on delete restrict,
  appointment_id      uuid references appointments(id) on delete set null,
  medical_record_id   uuid references medical_records(id) on delete set null,
  order_date          timestamptz not null default now(),
  priority            exam_priority not null default 'rotina',
  status              exam_order_status not null default 'solicitado',
  laboratory          text,
  clinical_indication text,
  notes               text,
  verification_code   text unique,
  created_by          uuid references users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table exam_order_items (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics(id) on delete cascade,
  exam_order_id   uuid not null references exam_orders(id) on delete cascade,
  exam_catalog_id uuid references exam_catalog(id) on delete set null,
  exam_name       text not null,
  tuss_code       text,
  status          exam_item_status not null default 'solicitado',
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create table exam_results (
  id                 uuid primary key default gen_random_uuid(),
  clinic_id          uuid not null references clinics(id) on delete cascade,
  exam_order_id      uuid not null references exam_orders(id) on delete cascade,
  exam_order_item_id uuid references exam_order_items(id) on delete cascade,
  result_summary     text,
  result_text        text,
  reference_range    text,
  attachment_path    text,
  released_by        uuid references users(id) on delete set null,
  released_at        timestamptz,
  status             exam_result_status not null default 'preliminar',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
