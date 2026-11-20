import{r as e}from"./db-DIZA_RBl.js";async function t(t,n,r){return e({userId:t,clinicId:n},async e=>{let t=[],n=[];r?.type&&(t.push(r.type),n.push(`ft.type = $${t.length}::transaction_type`)),r?.status&&(t.push(r.status),n.push(`ft.status = $${t.length}::transaction_status`)),r?.from&&(t.push(r.from),n.push(`ft.due_date >= $${t.length}::date`)),r?.to&&(t.push(r.to),n.push(`ft.due_date <= $${t.length}::date`));let i=n.length?`where ${n.join(` and `)}`:``;return e.query(`select ft.id,
              ft.type::text as type,
              ft.description,
              ft.amount::text as amount,
              ft.due_date::text as due_date,
              ft.paid_at::text as paid_at,
              ft.status::text as status,
              ft.payment_method::text as payment_method,
              fc.name as category_name,
              p.full_name as patient_name,
              pr.full_name as professional_name,
              ft.created_at::text as created_at
         from financial_transactions ft
         left join financial_categories fc on fc.id = ft.category_id
         left join patients p on p.id = ft.patient_id
         left join professionals pr on pr.id = ft.professional_id
         ${i}
        order by ft.due_date desc, ft.created_at desc
        limit 200`,t)})}async function n(t,n,r){return e({userId:t,clinicId:n},async e=>{let t=[n],i=[`(clinic_id is null or clinic_id = $1)`];return r&&(t.push(r),i.push(`type = $${t.length}::transaction_type`)),e.query(`select id, name, type::text as type
         from financial_categories
        where ${i.join(` and `)}
        order by name`,t)})}async function r(t,n){return e({userId:t,clinicId:n},async e=>{let t=(await e.query(`select
         coalesce(sum(amount) filter (where type='receita' and status='pago' and paid_at >= date_trunc('month', current_date)::date), 0)::text as revenue_month,
         coalesce(sum(amount) filter (where type='despesa' and status='pago' and paid_at >= date_trunc('month', current_date)::date), 0)::text as expense_month,
         coalesce(sum(amount) filter (where type='receita' and status in ('pendente','atrasado')), 0)::text as receivable_open,
         coalesce(sum(amount) filter (where type='despesa' and status in ('pendente','atrasado')), 0)::text as payable_open
       from financial_transactions`))[0];return{revenueMonth:Number(t?.revenue_month??0),expenseMonth:Number(t?.expense_month??0),receivableOpen:Number(t?.receivable_open??0),payableOpen:Number(t?.payable_open??0)}})}export{n,t as r,r as t};
//# sourceMappingURL=financeiro-D1iN5weL.js.map