import{r as e}from"./db-DIZA_RBl.js";var t=`
  a.id,
  a.unit_id,
  u.name as unit_name,
  a.patient_id,
  p.full_name as patient_name,
  a.professional_id,
  pr.full_name as professional_name,
  pr.calendar_color as professional_color,
  a.type::text as type,
  a.status::text as status,
  a.scheduled_start::text as scheduled_start,
  a.scheduled_end::text as scheduled_end,
  a.checked_in_at::text as checked_in_at,
  a.started_at::text as started_at,
  a.finished_at::text as finished_at,
  a.payment_method::text as payment_method,
  a.amount::text as amount,
  a.notes,
  a.cancellation_reason
`;async function n(n,r,i){let{date:a,professionalId:o,unitId:s}=i;return e({userId:n,clinicId:r},async e=>{let n=[a],r=[`a.scheduled_start >= $1::date`,`a.scheduled_start < ($1::date + interval '1 day')`];return o&&(n.push(o),r.push(`a.professional_id = $${n.length}::uuid`)),s&&(n.push(s),r.push(`a.unit_id = $${n.length}::uuid`)),e.query(`select ${t}
         from appointments a
         join clinic_units u on u.id = a.unit_id
         join patients p on p.id = a.patient_id
         join professionals pr on pr.id = a.professional_id
        where ${r.join(` and `)}
        order by a.scheduled_start`,n)})}async function r(n,r,i){let{date:a,professionalId:o,unitId:s}=i;return e({userId:n,clinicId:r},async e=>{let n=new Date(`${a}T00:00:00`),r=n.getDay(),i=new Date(n);i.setDate(n.getDate()-(r+6)%7);let c=[i.toISOString().slice(0,10),new Date(i.getTime()+5184e5).toISOString().slice(0,10)],l=[`a.scheduled_start >= $1::date`,`a.scheduled_start < ($2::date + interval '1 day')`];return o&&(c.push(o),l.push(`a.professional_id = $${c.length}::uuid`)),s&&(c.push(s),l.push(`a.unit_id = $${c.length}::uuid`)),e.query(`select ${t}
         from appointments a
         join clinic_units u on u.id = a.unit_id
         join patients p on p.id = a.patient_id
         join professionals pr on pr.id = a.professional_id
        where ${l.join(` and `)}
        order by a.scheduled_start`,c)})}async function i(n,r,i){let{from:a,to:o,professionalId:s}=i;return e({userId:n,clinicId:r},async e=>{let n=[a,o],r=[`a.scheduled_start >= $1::date`,`a.scheduled_start < ($2::date + interval '1 day')`];return s&&(n.push(s),r.push(`a.professional_id = $${n.length}::uuid`)),e.query(`select ${t}
         from appointments a
         join clinic_units u on u.id = a.unit_id
         join patients p on p.id = a.patient_id
         join professionals pr on pr.id = a.professional_id
        where ${r.join(` and `)}
        order by a.scheduled_start`,n)})}async function a(n,r,i){return e({userId:n,clinicId:r},async e=>(await e.query(`select ${t}
         from appointments a
         join clinic_units u on u.id = a.unit_id
         join patients p on p.id = a.patient_id
         join professionals pr on pr.id = a.professional_id
        where a.id = $1`,[i]))[0]??null)}async function o(t,n,r){return e({userId:t,clinicId:n},async e=>{let t=[],n=[];r&&(t.push(r),n.push(`sb.professional_id = $${t.length}::uuid`));let i=n.length?`where ${n.join(` and `)}`:``;return e.query(`select sb.id,
              sb.professional_id,
              pr.full_name as professional_name,
              sb.unit_id,
              u.name as unit_name,
              sb.starts_at::text as starts_at,
              sb.ends_at::text as ends_at,
              sb.reason,
              sb.created_at::text as created_at
         from schedule_blocks sb
         join professionals pr on pr.id = sb.professional_id
         left join clinic_units u on u.id = sb.unit_id
         ${i}
        order by sb.starts_at desc`,t)})}async function s(t,n,r){return e({userId:t,clinicId:n},async e=>{let t=[],n=[];r&&(t.push(r),n.push(`wl.status = $${t.length}`));let i=n.length?`where ${n.join(` and `)}`:``;return e.query(`select wl.id,
              wl.unit_id,
              u.name as unit_name,
              wl.patient_id,
              p.full_name as patient_name,
              wl.professional_id,
              pr.full_name as professional_name,
              wl.priority,
              wl.desired_from::text as desired_from,
              wl.desired_to::text as desired_to,
              wl.notes,
              wl.status::text as status,
              wl.created_at::text as created_at
         from waiting_list wl
         join clinic_units u on u.id = wl.unit_id
         join patients p on p.id = wl.patient_id
         left join professionals pr on pr.id = wl.professional_id
         ${i}
        order by wl.priority asc, wl.created_at`,t)})}async function c(t,n,r){return e({userId:t,clinicId:n},async e=>e.query(`select id, scheduled_start::text as scheduled_start, type::text as type
         from appointments
        where patient_id = $1
        order by scheduled_start desc
        limit 50`,[r]))}async function l(t,n,r){return e({userId:t,clinicId:n},async e=>e.query(`select id,
              from_status::text as from_status,
              to_status::text as to_status,
              notes,
              created_at::text as created_at
         from appointment_status_history
        where appointment_id = $1
        order by created_at`,[r]))}export{r as a,s as c,i,l as n,c as o,n as r,o as s,a as t};
//# sourceMappingURL=agenda-Dw8eL1Co.js.map