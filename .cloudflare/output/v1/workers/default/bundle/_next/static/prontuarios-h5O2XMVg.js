import{n as e}from"./rolldown-runtime-XKyaHtl9.js";import{r as t}from"./db-DIZA_RBl.js";var n=e({logRecordAccess:()=>s});async function r(e,n,r){return t({userId:e,clinicId:n},async e=>{let t=[],n=[];r&&(t.push(r),n.push(`mr.patient_id = $${t.length}::uuid`));let i=n.length?`where ${n.join(` and `)}`:``;return e.query(`select mr.id,
              mr.patient_id,
              p.full_name as patient_name,
              mr.professional_id,
              pr.full_name as professional_name,
              mr.appointment_id,
              mr.record_date::text as record_date,
              mr.status::text as status,
              mr.version,
              mr.parent_id,
              mr.chief_complaint,
              mr.assessment,
              mr.verification_code,
              mr.signed_at::text as signed_at,
              mr.signed_by::text as signed_by,
              mr.created_at::text as created_at
         from medical_records mr
         join patients p on p.id = mr.patient_id
         join professionals pr on pr.id = mr.professional_id
         ${i}
        order by mr.record_date desc
        limit 100`,t)})}async function i(e,n,r){return t({userId:e,clinicId:n},async e=>(await e.query(`select mr.id,
              mr.patient_id,
              p.full_name as patient_name,
              mr.professional_id,
              pr.full_name as professional_name,
              mr.appointment_id,
              mr.record_date::text as record_date,
              mr.status::text as status,
              mr.version,
              mr.parent_id,
              mr.chief_complaint,
              mr.history_present_illness,
              mr.physical_exam,
              mr.assessment,
              mr.plan,
              mr.icd10_codes,
              mr.notes,
              mr.content_hash,
              mr.signature_hash,
              mr.signature_method::text as signature_method,
              mr.verification_code,
              mr.signed_at::text as signed_at,
              mr.signed_by::text as signed_by,
              mr.created_at::text as created_at,
              mr.updated_at::text as updated_at
         from medical_records mr
         join patients p on p.id = mr.patient_id
         join professionals pr on pr.id = mr.professional_id
        where mr.id = $1`,[r]))[0]??null)}async function a(e,n,r){return t({userId:e,clinicId:n},async e=>e.query(`select id,
              note_type::text as note_type,
              content,
              status::text as status,
              signed_at::text as signed_at,
              created_at::text as created_at,
              created_by::text as created_by
         from clinical_notes
        where medical_record_id = $1
        order by created_at`,[r]))}async function o(e,n,r){return t({userId:e,clinicId:n},async e=>e.query(`select id,
              substance,
              reaction,
              severity::text as severity,
              notes,
              status::text as status,
              created_at::text as created_at
         from allergies
        where patient_id = $1
        order by created_at desc`,[r]))}async function s(e,n,r,i){try{await t({userId:e,clinicId:n},async t=>{await t.query(`insert into record_access_logs (clinic_id, medical_record_id, user_id, action)
         values ($1, $2::uuid, $3::uuid, $4)`,[n,r,e,i])})}catch{}}export{n as a,r as i,o as n,a as r,i as t};
//# sourceMappingURL=prontuarios-h5O2XMVg.js.map