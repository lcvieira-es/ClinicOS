import{r as e}from"./db-DIZA_RBl.js";async function t(t,n,r){return e({userId:t,clinicId:n},async e=>{let t=[],n=[];r&&(t.push(r),n.push(`eo.patient_id = $${t.length}::uuid`));let i=n.length?`where ${n.join(` and `)}`:``,a=await e.query(`select eo.id,
              eo.patient_id,
              p.full_name as patient_name,
              eo.professional_id,
              pr.full_name as professional_name,
              eo.appointment_id,
              eo.order_date::text as order_date,
              eo.priority::text as priority,
              eo.status::text as status,
              eo.laboratory,
              eo.clinical_indication,
              eo.notes,
              eo.verification_code,
              eo.created_at::text as created_at
         from exam_orders eo
         join patients p on p.id = eo.patient_id
         join professionals pr on pr.id = eo.professional_id
         ${i}
        order by eo.order_date desc
        limit 100`,t),o=[];for(let t of a){let n=await e.query(`select id, exam_catalog_id::text as exam_catalog_id, exam_name, tuss_code, status::text as status
           from exam_order_items
          where exam_order_id = $1
          order by sort_order, created_at`,[t.id]);o.push({...t,items:n})}return o})}async function n(t,n,r){return e({userId:t,clinicId:n},async e=>{let t=await e.query(`select eo.id,
              eo.patient_id,
              p.full_name as patient_name,
              eo.professional_id,
              pr.full_name as professional_name,
              eo.appointment_id,
              eo.order_date::text as order_date,
              eo.priority::text as priority,
              eo.status::text as status,
              eo.laboratory,
              eo.clinical_indication,
              eo.notes,
              eo.verification_code,
              eo.created_at::text as created_at
         from exam_orders eo
         join patients p on p.id = eo.patient_id
         join professionals pr on pr.id = eo.professional_id
        where eo.id = $1`,[r]);if(t.length===0)return null;let n=await e.query(`select id, exam_catalog_id::text as exam_catalog_id, exam_name, tuss_code, status::text as status
         from exam_order_items
        where exam_order_id = $1
        order by sort_order, created_at`,[r]);return{...t[0],items:n}})}async function r(t,n){return e({userId:t,clinicId:n},async e=>e.query(`select id, name, tuss_code, exam_type, reference_price::text as reference_price
         from exam_catalog
        where is_active = true
          and (clinic_id is null or clinic_id = $1)
        order by name`,[n]))}export{r as n,t as r,n as t};
//# sourceMappingURL=exames-CuxbLkPw.js.map