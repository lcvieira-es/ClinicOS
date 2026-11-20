import{r as e}from"./db-DIZA_RBl.js";async function t(t,n,r){return e({userId:t,clinicId:n},async e=>{let t=[],n=[];r&&(t.push(r),n.push(`pr.patient_id = $${t.length}::uuid`));let i=n.length?`where ${n.join(` and `)}`:``,a=await e.query(`select pr.id,
              pr.patient_id,
              p.full_name as patient_name,
              pr.professional_id,
              prof.full_name as professional_name,
              pr.appointment_id,
              pr.type::text as type,
              pr.status::text as status,
              pr.issued_at::text as issued_at,
              pr.verification_code,
              pr.notes,
              pr.content_hash,
              pr.signature_hash,
              pr.signed_at::text as signed_at,
              pr.signed_by::text as signed_by,
              pr.created_at::text as created_at
         from prescriptions pr
         join patients p on p.id = pr.patient_id
         join professionals prof on prof.id = pr.professional_id
         ${i}
        order by pr.created_at desc
        limit 100`,t),o=[];for(let t of a){let n=await e.query(`select id, medication_id::text as medication_id, medication_name, dose, frequency, duration, route, quantity::text as quantity, instructions, sort_order
           from prescription_items
          where prescription_id = $1
          order by sort_order, created_at`,[t.id]);o.push({...t,items:n})}return o})}async function n(t,n,r){return e({userId:t,clinicId:n},async e=>{let t=await e.query(`select pr.id,
              pr.patient_id,
              p.full_name as patient_name,
              pr.professional_id,
              prof.full_name as professional_name,
              pr.appointment_id,
              pr.type::text as type,
              pr.status::text as status,
              pr.issued_at::text as issued_at,
              pr.verification_code,
              pr.notes,
              pr.content_hash,
              pr.signature_hash,
              pr.signed_at::text as signed_at,
              pr.signed_by::text as signed_by,
              pr.created_at::text as created_at
         from prescriptions pr
         join patients p on p.id = pr.patient_id
         join professionals prof on prof.id = pr.professional_id
        where pr.id = $1`,[r]);if(t.length===0)return null;let n=await e.query(`select id, medication_id::text as medication_id, medication_name, dose, frequency, duration, route, quantity::text as quantity, instructions, sort_order
         from prescription_items
        where prescription_id = $1
        order by sort_order, created_at`,[r]);return{...t[0],items:n}})}async function r(t,n){return e({userId:t,clinicId:n},async e=>e.query(`select id,
              name,
              active_ingredient,
              presentation,
              controlled_class,
              default_dosage,
              (clinic_id is null) as is_global
         from medications
        where is_active = true
          and (clinic_id is null or clinic_id = $1)
        order by name`,[n]))}export{r as n,t as r,n as t};
//# sourceMappingURL=prescricoes-rG5gG9Sx.js.map