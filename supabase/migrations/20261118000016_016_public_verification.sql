-- =============================================================================
-- ClinicOS · 016 · Verificação pública de documento
-- =============================================================================

create or replace function app_verify_document(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_type text := null;
  v_status text := null;
  v_signed_at timestamptz := null;
  v_professional text := null;
  v_version integer := null;
begin
  select 'prontuario', mr.status::text, mr.signed_at, pr.full_name, mr.version
    into v_type, v_status, v_signed_at, v_professional, v_version
    from medical_records mr
    join professionals pr on pr.id = mr.professional_id
   where mr.verification_code = p_code
   limit 1;

  if v_type is null then
    select 'prescricao', pr.status::text, pr.signed_at, prof.full_name, 1
      into v_type, v_status, v_signed_at, v_professional, v_version
      from prescriptions pr
      join professionals prof on prof.id = pr.professional_id
     where pr.verification_code = p_code
     limit 1;
  end if;

  if v_type is null then
    return jsonb_build_object('found', false);
  end if;

  return jsonb_build_object(
    'found', true,
    'type', v_type,
    'status', v_status,
    'signedAt', v_signed_at,
    'professional', v_professional,
    'version', v_version,
    'valid', (v_status in ('assinado', 'emitida'))
  );
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'clinicos_app') then
    grant execute on function app_verify_document(text) to clinicos_app;
  end if;
end $$;
