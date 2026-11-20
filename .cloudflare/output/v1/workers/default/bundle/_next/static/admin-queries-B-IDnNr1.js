import{n as e}from"./db-DIZA_RBl.js";async function t(t,n){let{search:r,status:i,plan:a,page:o,pageSize:s}=n,c=(o-1)*s;return e(t,async e=>{let t=`
      where ($1 = ''
             or c.display_name ilike '%' || $1 || '%'
             or c.legal_name  ilike '%' || $1 || '%'
             or c.cnpj = $1)
        and ($2 = '' or c.status::text = $2)
        and ($3 = '' or p.slug = $3)`,n=await e.query(`select count(*)::int as total
         from clinics c
         left join subscriptions s on s.clinic_id = c.id
         left join plans p on p.id = s.plan_id
         ${t}`,[r,i,a]);return{items:await e.query(`select c.id,
              c.display_name,
              c.legal_name,
              c.cnpj,
              c.status::text as status,
              c.city,
              c.state::text as state,
              c.created_at,
              p.name as plan_name,
              p.slug as plan_slug,
              s.status::text as subscription_status,
              s.periodicity::text as periodicity
         from clinics c
         left join subscriptions s on s.clinic_id = c.id
         left join plans p on p.id = s.plan_id
         ${t}
        order by c.created_at desc
        limit $4 offset $5`,[r,i,a,s,c]),total:n[0]?.total??0,page:o,pageSize:s}})}async function n(t){return e(t,async e=>{let t=(await e.query(`select count(*)::int as total,
              count(*) filter (where status = 'ativa')::int as active,
              count(*) filter (where status = 'em_implantacao')::int as setting_up,
              count(*) filter (where status = 'suspensa')::int as suspended
         from clinics`))[0];return{total:t?.total??0,active:t?.active??0,settingUp:t?.setting_up??0,suspended:t?.suspended??0}})}async function r(t,n){return e(t,async e=>{let t=(await e.query(`select id, display_name, legal_name, trade_name, cnpj, email, phone, whatsapp,
              address, address_number, neighborhood, city, state::text as state,
              status::text as status, portal_slug, created_at, notes
         from clinics
        where id = $1
        limit 1`,[n]))[0];if(!t)return null;let[r,i,a,o,s]=await Promise.all([e.query(`select id, name, city, state::text as state, is_headquarters, status
           from clinic_units
          where clinic_id = $1
          order by is_headquarters desc, name`,[n]),e.query(`select m.id as membership_id,
                m.user_id,
                u.full_name,
                u.email,
                m.role::text as role,
                m.status::text as status
           from clinic_memberships m
           join users u on u.id = m.user_id
          where m.clinic_id = $1
            and m.role = 'clinic_admin'
          order by u.full_name`,[n]),e.query(`select s.id,
                s.plan_id,
                p.name as plan_name,
                p.slug as plan_slug,
                s.status::text as status,
                s.periodicity::text as periodicity,
                s.price::text as price,
                s.trial_ends_at,
                s.current_period_end,
                s.gateway::text as gateway,
                s.started_at
           from subscriptions s
           join plans p on p.id = s.plan_id
          where s.clinic_id = $1
          limit 1`,[n]),e.query(`select m.id,
                m.key,
                m.name,
                m.category::text as category,
                cm.source::text as source,
                cm.enabled,
                cm.price::text as price,
                m.is_core
           from clinic_modules cm
           join modules m on m.id = cm.module_id
          where cm.clinic_id = $1
          order by m.sort_order, m.name`,[n]),e.query(`select id, amount::text as amount, due_date, paid_at, status::text as status, created_at
           from subscription_invoices
          where clinic_id = $1
          order by due_date desc
          limit 12`,[n])]);return{clinic:t,units:r,admins:i,subscription:a[0]??null,modules:o,invoices:s}})}async function i(t){return e(t,async e=>e.query(`select p.id,
              p.name,
              p.slug,
              p.description,
              p.monthly_price::text as monthly_price,
              p.annual_price::text as annual_price,
              p.user_limit,
              p.professional_limit,
              p.unit_limit,
              p.patient_limit,
              p.storage_gb,
              p.ai_interaction_limit,
              p.message_limit,
              p.trial_days,
              p.is_active,
              p.sort_order,
              (select count(*)::int from plan_modules pm where pm.plan_id = p.id) as module_count,
              (select count(*)::int from subscriptions s
                where s.plan_id = p.id and s.status = 'ativa') as active_subscriptions
         from plans p
        order by p.sort_order, p.name`))}async function a(t){return e(t,async e=>{let t=await e.query(`select m.id, m.key, m.name, m.description, m.category::text as category,
              m.audience::text as audience, m.icon, m.route, m.is_core, m.is_plan,
              m.is_active, m.sort_order
         from modules m
        where m.audience = 'clinica'
        order by m.category, m.sort_order, m.name`);if(t.length===0)return[];let n=t.map(e=>e.id),[r,i]=await Promise.all([e.query(`select module_id, id, name, description
           from module_features
          where module_id = any($1::uuid[])
          order by sort_order, name`,[n]),e.query(`select module_id, count(*)::int as adoption
           from clinic_modules
          where enabled = true
          group by module_id`)]),a=new Map;for(let e of r){let t=a.get(e.module_id)??[];t.push(e),a.set(e.module_id,t)}let o=new Map(i.map(e=>[e.module_id,e.adoption]));return t.map(e=>({...e,adoption:o.get(e.id)??0,features:a.get(e.id)??[]}))})}async function o(t,n){let{search:r,status:i,page:a,pageSize:o}=n,s=(a-1)*o;return e(t,async e=>{let t=`
      where ($1 = ''
             or c.display_name ilike '%' || $1 || '%'
             or c.legal_name  ilike '%' || $1 || '%'
             or c.cnpj = $1)
        and ($2 = '' or s.status::text = $2)`,n=await e.query(`select count(*)::int as total
         from subscriptions s
         join clinics c on c.id = s.clinic_id
         ${t}`,[r,i]);return{items:await e.query(`select s.id,
              s.clinic_id,
              c.display_name as clinic_name,
              s.plan_id,
              p.name as plan_name,
              p.slug as plan_slug,
              s.status::text as status,
              s.periodicity::text as periodicity,
              s.price::text as price,
              s.started_at,
              s.trial_ends_at,
              s.current_period_end,
              (
                select i.id
                  from subscription_invoices i
                 where i.subscription_id = s.id
                   and i.status in ('aberta', 'vencida')
                 order by i.due_date
                 limit 1
              ) as open_invoice_id
         from subscriptions s
         join clinics c on c.id = s.clinic_id
         join plans p on p.id = s.plan_id
         ${t}
        order by s.current_period_end nulls last, c.display_name
        limit $3 offset $4`,[r,i,o,s]),total:n[0]?.total??0,page:a,pageSize:o}})}async function s(t,n){let{status:r,search:i,page:a,pageSize:o}=n,s=(a-1)*o;return e(t,async e=>{let t=`
      where ($1 = '' or i.status::text = $1)
        and ($2 = ''
             or c.display_name ilike '%' || $2 || '%'
             or c.legal_name  ilike '%' || $2 || '%')`,n=await e.query(`select count(*)::int as total
         from subscription_invoices i
         join clinics c on c.id = i.clinic_id
         ${t}`,[r,i]);return{items:await e.query(`select i.id,
              i.clinic_id,
              c.display_name as clinic_name,
              p.name as plan_name,
              i.amount::text as amount,
              i.due_date,
              i.paid_at,
              i.status::text as status
         from subscription_invoices i
         join clinics c on c.id = i.clinic_id
         join subscriptions s on s.id = i.subscription_id
         join plans p on p.id = s.plan_id
         ${t}
        order by i.due_date desc
        limit $3 offset $4`,[r,i,o,s]),total:n[0]?.total??0,page:a,pageSize:o}})}async function c(t){return e(t,async e=>{let t=(await e.query(`select
         count(*) filter (where status in ('aberta', 'vencida'))::int as open_total,
         coalesce(sum(amount) filter (where status in ('aberta', 'vencida')), 0)::text as open_amount,
         count(*) filter (where status = 'vencida')::int as overdue_total,
         coalesce(sum(amount) filter (where status = 'vencida'), 0)::text as overdue_amount,
         count(*) filter (where status = 'paga' and paid_at >= date_trunc('month', current_date)::date)::int as paid_month,
         coalesce(sum(amount) filter (where status = 'paga' and paid_at >= date_trunc('month', current_date)::date), 0)::text as paid_month_amount
       from subscription_invoices`))[0];return{openTotal:t?.open_total??0,openAmount:Number(t?.open_amount??0),overdueTotal:t?.overdue_total??0,overdueAmount:Number(t?.overdue_amount??0),paidMonth:t?.paid_month??0,paidMonthAmount:Number(t?.paid_month_amount??0)}})}async function l(t){return e(t,async e=>{let[t,n,r,i]=await Promise.all([e.query(`select p.name,
                p.slug,
                count(s.id) filter (where s.status = 'ativa')::int as subscriptions,
                coalesce(sum(
                  case when periodicity = 'anual' then price / 12 else price end
                ) filter (where s.status = 'ativa'), 0)::text as mrr
           from plans p
           left join subscriptions s on s.plan_id = p.id
          group by p.id, p.name, p.slug, p.sort_order
          order by p.sort_order`),e.query(`select status::text as status, count(*)::int as count
           from subscriptions
          group by status
          order by status`),e.query(`select m.name,
                m.key,
                count(cm.id) filter (where cm.enabled)::int as adoption
           from modules m
           left join clinic_modules cm on cm.module_id = m.id
          where m.audience = 'clinica'
          group by m.id, m.name, m.key, m.sort_order
          order by adoption desc, m.sort_order
          limit 12`),e.query(`select c.display_name as clinic_name,
                p.name as plan_name,
                s.periodicity::text as periodicity,
                s.current_period_end,
                s.price::text as amount
           from subscriptions s
           join clinics c on c.id = s.clinic_id
           join plans p on p.id = s.plan_id
          where s.status in ('ativa', 'em_teste', 'inadimplente', 'vencida')
            and s.current_period_end between current_date and current_date + 30
          order by s.current_period_end`)]);return{mrrByPlan:t,subscriptionsByStatus:n,moduleAdoption:r,renewals30:i}})}async function u(t){return e(t,async e=>{let t=await e.query(`select key, value from platform_settings`),n=new Map(t.map(e=>[e.key,e.value])),r=(e,t)=>String(n.get(e)?.value??t),i=(e,t)=>Number(n.get(e)?.value??t),a=n.get(`platform.ai_guardrails`)??{};return{platformName:r(`platform.name`,`ClinicOS`),supportEmail:r(`platform.support_email`,``),defaultTrialDays:i(`platform.default_trial_days`,14),defaultGateway:r(`platform.default_gateway`,`manual`),defaultPeriodicity:r(`platform.default_periodicity`,`mensal`),whatsappMode:r(`platform.whatsapp_mode`,`manual`),aiGuardrails:{diagnosis:!!(a.diagnosis??!1),prescribing:!!(a.prescribing??!1),human_review:!!(a.human_review??!0)}}})}async function d(t,n){return e(t,async e=>e.query(`select m.id, m.key, m.name, m.category::text as category
         from modules m
        where m.audience = 'clinica'
          and m.is_active = true
          and m.is_core = false
          and not exists (
            select 1
              from clinic_modules cm
             where cm.clinic_id = $1
               and cm.module_id = m.id
               and cm.enabled = true
          )
        order by m.sort_order, m.name`,[n]))}export{l as a,s as c,o as d,c as i,a as l,r as n,u as o,n as r,t as s,d as t,i as u};
//# sourceMappingURL=admin-queries-B-IDnNr1.js.map