import{n as e}from"./db-DIZA_RBl.js";async function t(t){return e(t,async e=>{let t=(await e.query(`select
         (select count(*) from clinics)::int as clinics_total,
         (select count(*) from clinics where status = 'ativa')::int as clinics_active,
         (select count(*) from clinics where status = 'em_implantacao')::int as clinics_setup,
         (select count(*) from clinics where status = 'suspensa')::int as clinics_suspended,
         (select count(*) from subscriptions where status = 'ativa')::int as subscriptions_active,
         (select count(*) from subscriptions where status in ('inadimplente', 'vencida'))::int as subscriptions_overdue,
         (
           select coalesce(sum(
             case when periodicity = 'anual' then price / 12 else price end
           ), 0)
             from subscriptions
            where status = 'ativa'
         )::text as mrr,
         (
           select coalesce(sum(
             case when periodicity = 'anual' then price else price * 12 end
           ), 0)
             from subscriptions
            where status = 'ativa'
         )::text as arr,
         (select count(*) from subscription_invoices where status in ('aberta', 'vencida'))::int as open_invoices,
         (select coalesce(sum(amount), 0) from subscription_invoices where status = 'vencida')::text as overdue_amount,
         (
           select count(*)
             from subscription_invoices
            where status in ('aberta', 'vencida')
              and due_date between current_date and current_date + 30
         )::int as renewals_30,
         (select count(*) from plans where is_active = true)::int as plans_active,
         (select count(*) from modules where is_active = true)::int as modules_active`))[0],n=Number(t?.mrr??0),r=Number(t?.arr??0),i=t?.subscriptions_active??0;return{clinicsTotal:t?.clinics_total??0,clinicsActive:t?.clinics_active??0,clinicsSetup:t?.clinics_setup??0,clinicsSuspended:t?.clinics_suspended??0,subscriptionsActive:i,subscriptionsOverdue:t?.subscriptions_overdue??0,mrr:n,arr:r,ticket:i>0?n/i:0,openInvoices:t?.open_invoices??0,overdueAmount:Number(t?.overdue_amount??0),renewals30:t?.renewals_30??0,plansActive:t?.plans_active??0,modulesActive:t?.modules_active??0}})}async function n(t){return e(t,async e=>(await e.query(`select p.name,
              p.slug,
              count(s.id) filter (where s.status in ('ativa', 'em_teste'))::int as clinics,
              coalesce(sum(
                case when s.status = 'ativa'
                  then case when s.periodicity = 'anual' then s.price / 12 else s.price end
                  else 0
                end
              ), 0)::text as revenue
         from plans p
         left join subscriptions s on s.plan_id = p.id
        group by p.id, p.name, p.slug, p.sort_order
        order by p.sort_order`)).map(e=>({name:e.name,slug:e.slug,clinics:e.clinics,revenue:Number(e.revenue)})))}async function r(t){return e(t,async e=>e.query(`select s.id,
              c.display_name as clinic_name,
              p.name as plan_name,
              s.status::text as status,
              s.price::text as price,
              s.periodicity::text as periodicity,
              s.current_period_end
         from subscriptions s
         join clinics c on c.id = s.clinic_id
         join plans p on p.id = s.plan_id
        where s.status in ('ativa', 'em_teste', 'inadimplente', 'vencida')
        order by s.current_period_end nulls last
        limit 6`))}async function i(t){return e(t,async e=>e.query(`select c.id,
              c.display_name,
              c.status::text as status,
              c.created_at,
              p.name as plan_name,
              s.status::text as subscription_status
         from clinics c
         left join subscriptions s on s.clinic_id = c.id
         left join plans p on p.id = s.plan_id
        order by c.created_at desc
        limit 6`))}async function a(t){return e(t,async e=>(await e.query(`select count(*)::int as total
         from notifications
        where user_id = $1
          and read_at is null`,[t]))[0]?.total??0)}export{r as a,i,t as n,a as r,n as t};
//# sourceMappingURL=queries-CgRG_sVn.js.map