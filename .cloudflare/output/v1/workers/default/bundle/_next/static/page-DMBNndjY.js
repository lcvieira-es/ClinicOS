import{t as e}from"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-rsc-entry~page~page~pag~nhc13wtx-BuxNExX0.js";import{n as t}from"./module-guard-DENMAsQa.js";import{t as n}from"./access-restricted-DqK0ooye.js";import{o as r}from"./patients-CQK8yg_h.js";import{n as i}from"./professionals-B_FODUTg.js";import{n as a}from"./units-DO9ht__k.js";import{r as o}from"./db-DIZA_RBl.js";import{t as s}from"./page-header-Bf6nb68S.js";import{n as c,t as l}from"./card-C2ZN4jPY.js";import{n as u}from"./button-C3DJWZE-.js";import{t as d}from"./appointment-form-BpMFhAar.js";import{t as f}from"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-rsc-entry~page~page~pag~n6n7luxa-CNb9Zhsj.js";async function p(e,t){return o({userId:e,clinicId:t},async e=>e.query(`select professional_id::text as professional_id,
              unit_id::text as unit_id,
              weekday::int as weekday,
              start_time::text as start_time,
              end_time::text as end_time,
              slot_minutes
         from professional_schedules
        where is_active = true
        order by professional_id, weekday, start_time`))}async function m(e,t,n){return n.length===0?[]:o({userId:e,clinicId:t},async e=>e.query(`select professional_id::text as professional_id,
              scheduled_start::text as scheduled_start,
              scheduled_end::text as scheduled_end
         from appointments
        where professional_id = any($1::uuid[])
          and status <> 'cancelada'
          and scheduled_start >= current_date`,[n]))}var h=f(),g={title:`Novo agendamento`};async function _(){let o=await t(`agenda`);if(!o.allowed||!o.permissions.has(`agenda:create`))return(0,h.jsx)(n,{homeHref:`/app/agenda`,homeLabel:`Voltar`});let f=o.user,[g,_,v,y]=await Promise.all([r(f.id,f.activeClinicId),i(f.id,f.activeClinicId),a(f.id,f.activeClinicId),p(f.id,f.activeClinicId)]),b=await m(f.id,f.activeClinicId,_.map(e=>e.id));return(0,h.jsxs)(`div`,{className:`animate-fade`,children:[(0,h.jsx)(s,{eyebrow:`Operação`,title:`Novo agendamento`,description:`Agende uma consulta verificando conflitos de horário.`,actions:(0,h.jsxs)(u,{href:`/app/agenda`,variant:`outline`,size:`sm`,children:[(0,h.jsx)(e,{className:`h-3.5 w-3.5`}),`Voltar`]})}),(0,h.jsx)(l,{children:(0,h.jsx)(c,{children:(0,h.jsx)(d,{patients:g,professionals:_.map(e=>({id:e.id,name:e.full_name,specialties:e.specialties??[]})),units:v.map(e=>({id:e.id,name:e.name})),schedules:y,busySlots:b})})})]})}export{_ as default,g as metadata};
//# sourceMappingURL=page-DMBNndjY.js.map