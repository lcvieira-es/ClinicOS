-- =============================================================================
-- ClinicOS · 009 · Auditoria encadeada (append-only, à prova de adulteração)
-- =============================================================================

create or replace function fn_audit_row()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_clinic      uuid;
  v_before      jsonb;
  v_after       jsonb;
  v_entity_id   text;
  v_prev        text;
  v_hash        text;
  v_payload     text;
  v_actor       uuid := app_current_user_id();
  v_role        app_role;
  v_action      audit_action := lower(tg_op)::audit_action;
  v_created_at  timestamptz := clock_timestamp();
begin
  if tg_op = 'DELETE' then
    v_before := to_jsonb(old);
    v_entity_id := coalesce(to_jsonb(old)->>'id', to_jsonb(old)->>'key');
    v_clinic := nullif(to_jsonb(old)->>'clinic_id', '')::uuid;
  elsif tg_op = 'UPDATE' then
    v_before := to_jsonb(old);
    v_after := to_jsonb(new);
    v_entity_id := coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'key');
    v_clinic := coalesce(
      nullif(to_jsonb(new)->>'clinic_id', '')::uuid,
      nullif(to_jsonb(old)->>'clinic_id', '')::uuid
    );
  else
    v_after := to_jsonb(new);
    v_entity_id := coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'key');
    v_clinic := nullif(to_jsonb(new)->>'clinic_id', '')::uuid;
  end if;

  select m.role into v_role
  from clinic_memberships m
  where m.clinic_id = v_clinic
    and m.user_id = v_actor
    and m.status = 'ativo';

  if v_role is null and app_is_platform_admin() then
    v_role := 'platform_admin';
  end if;

  perform pg_advisory_xact_lock(
    hashtext(coalesce(v_clinic::text, 'platform'))::bigint
  );

  select al.hash into v_prev
  from audit_logs al
  where al.clinic_id is not distinct from v_clinic
  order by al.created_at desc, al.id desc
  limit 1;

  v_payload :=
    coalesce(v_prev, '') || '|' ||
    tg_table_name || '|' ||
    v_action::text || '|' ||
    coalesce(v_clinic::text, '') || '|' ||
    coalesce(v_actor::text, '') || '|' ||
    coalesce(v_entity_id, '') || '|' ||
    coalesce(v_before::text, '') || '|' ||
    coalesce(v_after::text, '') || '|' ||
    ((extract(epoch from v_created_at) * 1000000)::bigint)::text;

  v_hash := encode(sha256(convert_to(v_payload, 'UTF8')), 'hex');

  insert into audit_logs (
    clinic_id, actor_user_id, actor_role, action, entity, entity_id,
    before_data, after_data, prev_hash, hash, created_at
  ) values (
    v_clinic, v_actor, v_role, v_action, tg_table_name, v_entity_id,
    v_before, v_after, v_prev, v_hash, v_created_at
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Verificação da cadeia de auditoria ------------------------------------------
create or replace function fn_verify_audit_chain(p_clinic uuid default null)
returns table (checked bigint, chain_valid boolean, broken_at bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_prev text := null;
  v_hash text;
  v_payload text;
  v_count bigint := 0;
begin
  for r in
    select * from audit_logs
    where clinic_id is not distinct from p_clinic
    order by created_at, id
  loop
    v_payload :=
      coalesce(v_prev, '') || '|' ||
      r.entity || '|' ||
      r.action::text || '|' ||
      coalesce(r.clinic_id::text, '') || '|' ||
      coalesce(r.actor_user_id::text, '') || '|' ||
      coalesce(r.entity_id, '') || '|' ||
      coalesce(r.before_data::text, '') || '|' ||
      coalesce(r.after_data::text, '') || '|' ||
      ((extract(epoch from r.created_at) * 1000000)::bigint)::text;

    v_hash := encode(sha256(convert_to(v_payload, 'UTF8')), 'hex');
    v_count := v_count + 1;

    if r.prev_hash is distinct from v_prev or r.hash <> v_hash then
      return query select v_count, false, r.id;
      return;
    end if;

    v_prev := r.hash;
  end loop;

  return query select v_count, true, null::bigint;
end;
$$;

-- Triggers de auditoria --------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'clinics', 'clinic_units', 'clinic_memberships', 'professionals',
    'patients', 'patient_consents', 'appointments', 'medical_records',
    'clinical_notes', 'allergies', 'prescriptions', 'prescription_items',
    'exam_orders', 'exam_results', 'financial_transactions', 'insurance_claims',
    'inventory_items', 'inventory_movements', 'documents', 'subscriptions',
    'subscription_invoices', 'clinic_modules', 'plans', 'modules', 'platform_settings'
  ]
  loop
    execute format('drop trigger if exists trg_audit_%I on %I', t, t);
    execute format(
      'create trigger trg_audit_%I after insert or update or delete on %I for each row execute function fn_audit_row()',
      t, t
    );
  end loop;
end $$;
