import{r as e}from"./db-DIZA_RBl.js";async function t(t,n){return e({userId:t,clinicId:n},async e=>e.query(`select ic.id,
              ic.patient_id,
              p.full_name as patient_name,
              ic.provider_id,
              ip.name as provider_name,
              ic.guide_number,
              ic.tuss_code,
              ic.procedure_name,
              ic.presented_amount::text as presented_amount,
              ic.approved_amount::text as approved_amount,
              ic.status::text as status,
              ic.sent_at::text as sent_at,
              ic.approved_at::text as approved_at,
              ic.paid_at::text as paid_at,
              ic.notes,
              ic.created_at::text as created_at
         from insurance_claims ic
         join patients p on p.id = ic.patient_id
         join insurance_providers ip on ip.id = ic.provider_id
        order by ic.created_at desc
        limit 200`))}async function n(t,n){return e({userId:t,clinicId:n},async e=>e.query(`select id, name from insurance_providers where status = 'ativo' order by name`))}export{n,t};
//# sourceMappingURL=convenios-Bcqd5Bq5.js.map