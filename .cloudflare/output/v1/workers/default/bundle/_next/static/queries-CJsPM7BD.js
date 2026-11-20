import{r as e}from"./db-DIZA_RBl.js";async function t(t,n){return e({userId:t,clinicId:n},async e=>(await e.query(`select count(*)::int as total
         from notifications
        where user_id = $1
          and read_at is null`,[t]))[0]?.total??0)}async function n(t,n,r){return e({userId:t,clinicId:n},async e=>{let t=(await e.query(`select
         count(*) filter (where scheduled_start >= current_date and scheduled_start < current_date + interval '1 day')::int as today_total,
         count(*) filter (where scheduled_start >= current_date and scheduled_start < current_date + interval '1 day' and status = 'aguardando')::int as waiting,
         count(*) filter (where scheduled_start >= current_date and scheduled_start < current_date + interval '1 day' and status = 'realizada')::int as completed,
         count(*) filter (where scheduled_start >= current_date and scheduled_start < current_date + interval '1 day' and status = 'cancelada')::int as cancelled,
         count(*) filter (where scheduled_start >= current_date and scheduled_start < current_date + interval '1 day' and status = 'faltou')::int as no_show,
         coalesce(sum(amount) filter (
           where status = 'realizada'
             and scheduled_start >= date_trunc('month', current_date)
         ), 0)::text as production_month
       from appointments`))[0],n=await e.query(`select count(*)::int as total from patients where status <> 'arquivado'`),i=await e.query(`select count(*)::int as total
         from exam_orders
        where status in ('solicitado', 'coletado', 'em_analise')`),a=0,o=0,s=0,c=0;if(r){let t=(await e.query(`select
           coalesce(sum(amount) filter (
             where type = 'receita' and status = 'pago'
               and paid_at >= date_trunc('month', current_date)::date
           ), 0)::text as revenue_month,
           coalesce(sum(amount) filter (
             where type = 'despesa' and status = 'pago'
               and paid_at >= date_trunc('month', current_date)::date
           ), 0)::text as expense_month,
           coalesce(sum(amount) filter (
             where type = 'receita' and status in ('pendente', 'atrasado')
           ), 0)::text as receivable_open,
           coalesce(sum(amount) filter (
             where type = 'despesa' and status in ('pendente', 'atrasado')
           ), 0)::text as payable_open
         from financial_transactions`))[0];a=Number(t?.revenue_month??0),o=Number(t?.expense_month??0),s=Number(t?.receivable_open??0),c=Number(t?.payable_open??0)}let l=t?.today_total??0,u=t?.no_show??0,d=t?.completed??0;return{todayTotal:l,waiting:t?.waiting??0,completed:d,cancelled:t?.cancelled??0,noShow:u,productionMonth:Number(t?.production_month??0),revenueMonth:a,expenseMonth:o,receivableOpen:s,payableOpen:c,pendingExams:i[0]?.total??0,activePatients:n[0]?.total??0,noShowRate:l>0?Number((u/l*100).toFixed(1)):0}})}async function r(t,n){return e({userId:t,clinicId:n},async e=>e.query(`select a.id,
              a.scheduled_start,
              a.status::text as status,
              a.type::text as type,
              a.amount::text as amount,
              p.full_name as patient_name,
              pr.full_name as professional_name
         from appointments a
         join patients p on p.id = a.patient_id
         join professionals pr on pr.id = a.professional_id
        where a.scheduled_start >= current_date
          and a.scheduled_start < current_date + interval '1 day'
        order by a.scheduled_start
        limit 8`))}async function i(t,n){return e({userId:t,clinicId:n},async e=>e.query(`select eo.id,
              eo.order_date,
              eo.status::text as status,
              eo.priority::text as priority,
              p.full_name as patient_name,
              pr.full_name as professional_name
         from exam_orders eo
         join patients p on p.id = eo.patient_id
         join professionals pr on pr.id = eo.professional_id
        where eo.status in ('solicitado', 'coletado', 'em_analise')
        order by
          case eo.priority when 'emergencia' then 1 when 'urgente' then 2 else 3 end,
          eo.order_date
        limit 5`))}export{t as i,i as n,r,n as t};
//# sourceMappingURL=queries-CJsPM7BD.js.map