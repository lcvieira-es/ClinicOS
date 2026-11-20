import{r as e}from"./db-DIZA_RBl.js";async function t(t,n,r){return e({userId:t,clinicId:n},async e=>{let t=await e.query(`select id, full_name, email, phone, birth_date, lgpd_consent_at
         from patients
        where id = $1
        limit 1`,[r]),n=await e.query(`select a.id,
              a.scheduled_start,
              a.scheduled_end,
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
        limit 20`,[r]),i=await e.query(`select a.id,
              a.scheduled_start,
              a.scheduled_end,
              a.status::text as status,
              a.type::text as type,
              a.amount::text as amount,
              pr.full_name as professional_name,
              u.name as unit_name
         from appointments a
         join professionals pr on pr.id = a.professional_id
         join clinic_units u on u.id = a.unit_id
        where a.patient_id = $1
          and a.scheduled_start >= now()
          and a.status not in ('cancelada', 'faltou', 'realizada')
        order by a.scheduled_start
        limit 1`,[r]),a=await e.query(`select er.id,
              er.result_summary,
              er.result_text,
              er.released_at,
              eo.order_date,
              pr.full_name as professional_name,
              (
                select string_agg(eoi.exam_name, ', ' order by eoi.sort_order)
                  from exam_order_items eoi
                 where eoi.exam_order_id = eo.id
              ) as exam_names
         from exam_results er
         join exam_orders eo on eo.id = er.exam_order_id
         join professionals pr on pr.id = eo.professional_id
        where eo.patient_id = $1
          and er.status = 'liberado'
        order by er.released_at desc nulls last
        limit 10`,[r]),o=await e.query(`select p.id,
              p.type::text as type,
              p.status::text as status,
              p.issued_at,
              p.verification_code,
              (
                select string_agg(pi.medication_name, ', ' order by pi.sort_order)
                  from prescription_items pi
                 where pi.prescription_id = p.id
              ) as medication_names
         from prescriptions p
        where p.patient_id = $1
          and p.status = 'emitida'
        order by p.issued_at desc nulls last
        limit 10`,[r]),s=await e.query(`select id, title, document_type, created_at
         from documents
        where patient_id = $1
        order by created_at desc
        limit 10`,[r]),c=await e.query(`select
         (select count(*) from appointments where patient_id = $1 and status = 'realizada')::int as completed_appointments,
         (select count(*) from exam_orders where patient_id = $1 and status in ('solicitado', 'coletado', 'em_analise'))::int as pending_exams,
         (select count(*) from exam_results er join exam_orders eo on eo.id = er.exam_order_id where eo.patient_id = $1 and er.status = 'liberado')::int as released_results`,[r]);return{profile:t[0]??null,nextAppointment:i[0]??null,appointments:n,latestResults:a,prescriptions:o,documents:s,completedAppointments:c[0]?.completed_appointments??0,pendingExams:c[0]?.pending_exams??0,releasedResults:c[0]?.released_results??0}})}export{t};
//# sourceMappingURL=queries-DCHtQcxF.js.map