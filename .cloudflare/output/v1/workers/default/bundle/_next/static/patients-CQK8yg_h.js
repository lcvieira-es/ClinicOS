import{r as e}from"./db-DIZA_RBl.js";var t=`
  v.id,
  v.full_name,
  v.social_name,
  v.cpf,
  v.birth_date::text as birth_date,
  v.sex::text as sex,
  v.phone,
  v.whatsapp,
  v.email,
  v.city,
  v.state,
  v.status::text as status,
  v.insurance_provider_name,
  v.lgpd_consent_at::text as lgpd_consent_at,
  v.created_at::text as created_at
`,n=new Set([`ativo`,`inativo`,`arquivado`]);async function r(r,i,a){let{search:o=``,status:s=``,page:c,pageSize:l,canSeeSensitive:u}=a;return e({userId:r,clinicId:i},async e=>{let r=[],i=e=>(r.push(e),`$${r.length}`),a=[],d=o.trim();if(d){let e=i(`%${d}%`),t=d.replace(/\D/g,``),n=[`v.full_name ilike ${e}`,`v.email ilike ${e}`];if(t.length>=7){let e=i(`%${t}%`);n.push(`v.phone ilike ${e}`),n.push(`v.whatsapp ilike ${e}`)}t.length===11&&u&&n.push(`p.cpf = ${i(t)}`),a.push(`(${n.join(` or `)})`)}s&&n.has(s)&&a.push(`v.status = ${i(s)}`);let f=`from v_patients_directory v join patients p on p.id = v.id ${a.length?`where ${a.join(` and `)}`:``}`,p=await e.query(`select count(*)::int as total ${f}`,r),m=i(l),h=i((c-1)*l);return{items:await e.query(`select ${t} ${f}
        order by v.full_name
        limit ${m} offset ${h}`,r),page:c,pageSize:l,total:p[0]?.total??0}})}async function i(n,r,i){return e({userId:n,clinicId:r},async e=>(await e.query(`select ${t},
              p.gender,
              p.cep,
              p.address,
              p.address_number,
              p.complement,
              p.neighborhood,
              p.insurance_provider_id,
              p.insurance_member_number,
              p.emergency_contact_name,
              p.emergency_contact_phone,
              p.preferred_unit_id,
              p.notes,
              p.lgpd_consent_by::text as lgpd_consent_by,
              p.updated_at::text as updated_at
         from v_patients_directory v
         join patients p on p.id = v.id
        where v.id = $1`,[i]))[0]??null)}async function a(t,n,r){return e({userId:t,clinicId:n},async e=>e.query(`select a.id,
              a.scheduled_start::text as scheduled_start,
              a.status::text as status,
              a.type::text as type,
              a.amount::text as amount,
              pr.full_name as professional_name,
              u.name as unit_name
         from appointments a
         join professionals pr on pr.id = a.professional_id
         join clinic_units u on u.id = a.unit_id
        where a.patient_id = $1
        order by a.scheduled_start desc
        limit 25`,[r]))}async function o(t,n,r){return e({userId:t,clinicId:n},async e=>e.query(`select id,
              type::text as type,
              granted,
              granted_at::text as granted_at,
              revoked_at::text as revoked_at,
              document_version,
              created_at::text as created_at
         from patient_consents
        where patient_id = $1
        order by created_at desc`,[r]))}async function s(t,n){return e({userId:t,clinicId:n},async e=>{let t=await e.query(`select distinct ip.id, ip.name
         from clinic_insurance_contracts c
         join insurance_providers ip on ip.id = c.provider_id
        where c.clinic_id = $1
          and c.status = 'ativo'
          and ip.status = 'ativo'
        order by ip.name`,[n]);return t.length>0?t:e.query(`select id, name
         from insurance_providers
        where status = 'ativo'
        order by name`)})}async function c(t,n){return e({userId:t,clinicId:n},async e=>e.query(`select id, full_name as name from patients where status <> 'arquivado' order by full_name`))}async function l(t,n){return e({userId:t,clinicId:n},async e=>{let t=(await e.query(`select count(*)::int as total,
              count(*) filter (where status = 'ativo')::int as active,
              count(*) filter (where status = 'inativo')::int as inactive,
              count(*) filter (where status = 'arquivado')::int as archived,
              count(*) filter (where lgpd_consent_at is null)::int as pending_consent
         from patients`))[0];return{total:t?.total??0,active:t?.active??0,inactive:t?.inactive??0,archived:t?.archived??0,pendingConsent:t?.pending_consent??0}})}export{s as a,l as i,a as n,c as o,o as r,r as s,i as t};
//# sourceMappingURL=patients-CQK8yg_h.js.map