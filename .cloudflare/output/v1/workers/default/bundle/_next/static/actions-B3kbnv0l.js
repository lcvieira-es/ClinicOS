import"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-rsc-entry~cache-callabl~h053e9lc-Bau50AnE.js";import{o as e}from"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-rsc-entry~cache-callabl~o4mewdgk-CpMeVdIn.js";import{t}from"./vinext-stage-runtime~page~page~page~page~page~page~page~page~page~page~page~page~page~page~~pbll4pnl-B1t1IQjD.js";import{n}from"./guards-DhwsrSca.js";import{n as r}from"./db-DIZA_RBl.js";import{t as i}from"./password-CSjfbUfr.js";import{a,c as o,i as s,n as c,o as l,r as u,s as d,t as f}from"./schemas-BrTGXDGy.js";import{randomBytes as p}from"node:crypto";function m(e){return o(c,e)}function h(e){return d(f,e)}var g=a({clinic:a({legalName:l().trim().min(3,`Razão social obrigatória.`),tradeName:l().trim().optional(),displayName:l().trim().min(2,`Nome de exibição obrigatório.`),cnpj:l().trim().regex(/^\d{14}$/,`CNPJ deve conter 14 dígitos.`).or(s(``)).optional(),email:l().trim().email(`E-mail inválido.`).or(s(``)).optional(),phone:l().trim().optional(),whatsapp:l().trim().optional(),cep:l().trim().optional(),address:l().trim().min(3,`Endereço obrigatório.`),addressNumber:l().trim().min(1,`Número obrigatório.`),neighborhood:l().trim().optional(),city:l().trim().min(2,`Cidade obrigatória.`),state:l().trim().regex(/^[A-Z]{2}$/,`UF inválida (2 letras).`),notes:l().trim().optional()}),unit:a({name:l().trim().min(2,`Nome da unidade obrigatório.`),internalCode:l().trim().optional(),phone:l().trim().optional(),email:l().trim().email(`E-mail da unidade inválido.`).or(s(``)).optional(),cep:l().trim().optional(),address:l().trim().optional(),addressNumber:l().trim().optional(),neighborhood:l().trim().optional(),city:l().trim().optional(),state:l().trim().regex(/^[A-Z]{2}$/,`UF inválida.`).or(s(``)).optional(),openingHours:l().trim().optional()}),admin:a({fullName:l().trim().min(3,`Nome do administrador obrigatório.`),email:l().trim().email(`E-mail do administrador inválido.`)}),subscription:a({planSlug:l().trim().min(1,`Selecione um plano.`),periodicity:u([`mensal`,`anual`])})});function _(e){return e.normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``).slice(0,40)}function v(){let e=p(16),t=``;for(let n of e)t+=`ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%`[n%61];return t}async function y(e,a){let o=await n(),s;try{s=JSON.parse(String(a.get(`payload`)??``))}catch{return{error:`Dados do assistente inválidos.`}}let c=g.safeParse(s);if(!c.success)return{error:c.error.issues[0]?.message??`Dados inválidos.`};let{clinic:l,unit:u,admin:d,subscription:f}=c.data;try{let e=await r(o.id,async e=>{let t=(await e.query(`select id, name, monthly_price::text as monthly_price, annual_price::text as annual_price,
                trial_days, is_active
           from plans
          where slug = $1
          limit 1`,[f.planSlug]))[0];if(!t||!t.is_active)throw Error(`Plano selecionado não está disponível.`);let n=`${_(l.displayName)||`clinica`}-${p(3).toString(`hex`)}`,r=(await e.query(`insert into clinics
           (legal_name, trade_name, display_name, cnpj, email, phone, whatsapp,
            cep, address, address_number, neighborhood, city, state,
            status, portal_slug, notes, settings)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::char(2),
                 'em_implantacao', $14, $15, '{"demo": false}'::jsonb)
         returning id`,[l.legalName,l.tradeName||null,l.displayName,l.cnpj||null,l.email||null,l.phone||null,l.whatsapp||null,l.cep||null,l.address,l.addressNumber,l.neighborhood||null,l.city,l.state,n,l.notes||null]))[0].id,a=(await e.query(`insert into clinic_units
           (clinic_id, name, type, internal_code, phone, email,
            cep, address, address_number, neighborhood, city, state,
            opening_hours, is_headquarters, status)
         values ($1, $2, 'matriz', $3, $4, $5,
                 $6, $7, $8, $9, $10, $11::char(2),
                 $12, true, 'ativa')
         returning id`,[r,u.name,u.internalCode||`MATRIZ-01`,u.phone||null,u.email||null,u.cep||null,u.address||l.address,u.addressNumber||l.addressNumber,u.neighborhood||l.neighborhood||null,u.city||l.city,u.state||l.state,u.openingHours||`Segunda a sexta, 08h às 18h`]))[0].id,s,c=null,m=!1,h=await e.query(`select id from users where lower(email) = lower($1) limit 1`,[d.email]);if(h[0])s=h[0].id;else{c=v();let t=await i(c);s=(await e.query(`insert into users (email, password_hash, full_name, status)
           values (lower($1), $2, $3, 'ativo')
           returning id`,[d.email,t,d.fullName]))[0].id,m=!0}let g=(await e.query(`insert into clinic_memberships (clinic_id, user_id, role, status, job_title, hired_at, invited_by)
         values ($1, $2, 'clinic_admin', 'ativo', 'Administrador(a)', current_date, $3)
         on conflict (clinic_id, user_id) do update
           set status = 'ativo',
               role = 'clinic_admin',
               updated_at = now()
         returning id`,[r,s,o.id]))[0].id;await e.query(`insert into membership_units (membership_id, unit_id, clinic_id)
         values ($1, $2, $3)
         on conflict do nothing`,[g,a,r]);let y=f.periodicity===`anual`?Number(t.annual_price):Number(t.monthly_price);return await e.query(`insert into subscriptions
           (clinic_id, plan_id, status, periodicity, price, started_at,
            current_period_start, current_period_end, trial_ends_at, gateway, created_by)
         values ($1, $2, 'em_teste', $3::billing_period, $4, current_date,
                 current_date, current_date + $5::int, current_date + $5::int, 'manual', $6)`,[r,t.id,f.periodicity,y,t.trial_days,o.id]),await e.query(`insert into clinic_modules (clinic_id, module_id, enabled, source, price, activated_at, created_by)
         select $1, pm.module_id, true, 'plano', 0, now(), $2
           from plan_modules pm
          where pm.plan_id = $3
         on conflict (clinic_id, module_id) do update
           set enabled = true,
               source = 'plano',
               activated_at = coalesce(clinic_modules.activated_at, now())`,[r,o.id,t.id]),{clinicId:r,temporaryPassword:c,passwordCreated:m}});return t(`/admin/clinicas`),t(`/admin`),{success:!0,clinicId:e.clinicId,clinicName:l.displayName,adminEmail:d.email.toLowerCase(),temporaryPassword:e.temporaryPassword,passwordCreated:e.passwordCreated}}catch(e){return{error:e instanceof Error?`Não foi possível criar a clínica: ${e.message}`:`Não foi possível criar a clínica.`}}}async function b(e){let i=await n(),a=String(e.get(`clinicId`)??``),o=String(e.get(`next`)??``);!a||o!==`ativa`&&o!==`suspensa`||(await r(i.id,async e=>{await e.query(`update clinics set status = $2::clinic_status, updated_at = now() where id = $1`,[a,o]),await e.query(`update subscriptions
          set status = case when $2 = 'suspensa'
                            then 'suspensa'::subscription_status
                            else 'ativa'::subscription_status
                       end,
              updated_at = now()
        where clinic_id = $1
          and status in ('ativa', 'em_teste', 'suspensa')`,[a,o])}),t(`/admin/clinicas/${a}`),t(`/admin/clinicas`),t(`/admin`))}var x=a({clinicId:l().uuid(),planId:l().uuid(),periodicity:u([`mensal`,`anual`])});async function S(e,i){let a=await n(),o=x.safeParse({clinicId:i.get(`clinicId`),planId:i.get(`planId`),periodicity:i.get(`periodicity`)});if(!o.success)return{error:`Dados inválidos.`};let{clinicId:s,planId:c,periodicity:l}=o.data;try{return await r(a.id,async e=>{let t=(await e.query(`select monthly_price::text as monthly_price, annual_price::text as annual_price, is_active
           from plans where id = $1 limit 1`,[c]))[0];if(!t||!t.is_active)throw Error(`Plano não disponível.`);let n=Number(l===`anual`?t.annual_price:t.monthly_price);await e.query(`update subscriptions
            set plan_id = $2, periodicity = $3::billing_period, price = $4, updated_at = now()
          where clinic_id = $1`,[s,c,l,n]),await e.query(`delete from clinic_modules
          where clinic_id = $1 and source = 'plano'`,[s]),await e.query(`insert into clinic_modules (clinic_id, module_id, enabled, source, price, activated_at, created_by)
         select $1, pm.module_id, true, 'plano', 0, now(), $2
           from plan_modules pm
          where pm.plan_id = $3`,[s,a.id,c])}),t(`/admin/clinicas/${s}`),t(`/admin/assinaturas`),t(`/admin`),{success:`Plano atualizado. Módulos recalculados.`}}catch(e){return{error:e instanceof Error?`Não foi possível alterar o plano: ${e.message}`:`Não foi possível alterar o plano.`}}}async function C(e,i){let a=await n(),o=String(i.get(`clinicId`)??``),s=String(i.get(`moduleId`)??``),c=Number(String(i.get(`price`)??`0`).replace(`,`,`.`));if(!o||!s||Number.isNaN(c)||c<0)return{error:`Dados inválidos.`};try{return await r(a.id,async e=>{await e.query(`insert into clinic_modules (clinic_id, module_id, enabled, source, price, activated_at, created_by)
         values ($1, $2, true, 'adicional', $3, now(), $4)
         on conflict (clinic_id, module_id) do update
           set enabled = true,
               source = 'adicional',
               price = excluded.price,
               expires_at = null,
               activated_at = coalesce(clinic_modules.activated_at, now())`,[o,s,c,a.id])}),t(`/admin/clinicas/${o}`),{success:`Módulo adicional ativado.`}}catch(e){return{error:e instanceof Error?`Não foi possível ativar o módulo: ${e.message}`:`Não foi possível ativar o módulo.`}}}async function w(e){let i=await n(),a=String(e.get(`clinicId`)??``),o=String(e.get(`moduleId`)??``);a&&o&&(await r(i.id,async e=>{await e.query(`delete from clinic_modules
        where clinic_id = $1 and module_id = $2 and source = 'adicional'`,[a,o])}),t(`/admin/clinicas/${a}`))}async function T(e,i){let a=await n(),o=String(i.get(`clinicId`)??``);if(!o)return{error:`Clínica inválida.`};try{return await r(a.id,async e=>{let t=(await e.query(`select id, price::text as price, current_period_end
           from subscriptions
          where clinic_id = $1
          limit 1`,[o]))[0];if(!t)throw Error(`Nenhuma assinatura encontrada.`);if((await e.query(`select id
           from subscription_invoices
          where subscription_id = $1
            and status in ('aberta', 'vencida')
          limit 1`,[t.id]))[0])throw Error(`Já existe uma fatura aberta ou vencida para esta assinatura.`);await e.query(`insert into subscription_invoices (clinic_id, subscription_id, amount, due_date, status, gateway)
         values ($1, $2, $3, coalesce($4::date, current_date + 30), 'aberta', 'manual')`,[o,t.id,Number(t.price),t.current_period_end])}),t(`/admin/clinicas/${o}`),t(`/admin/pagamentos`),{success:`Fatura gerada.`}}catch(e){return{error:e instanceof Error?e.message:`Não foi possível gerar a fatura.`}}}async function E(e,i){let a=await n(),o=String(i.get(`invoiceId`)??``);if(!o)return{error:`Fatura inválida.`};try{return await r(a.id,async e=>{let t=(await e.query(`select id, subscription_id, clinic_id
           from subscription_invoices
          where id = $1
          limit 1`,[o]))[0];if(!t)throw Error(`Fatura não encontrada.`);await e.query(`update subscription_invoices
            set status = 'paga',
                paid_at = current_date,
                updated_at = now()
          where id = $1
            and status in ('aberta', 'vencida')`,[o]),await e.query(`update subscriptions
            set status = case
                           when status in ('em_teste', 'inadimplente', 'vencida') then 'ativa'::subscription_status
                           else status
                         end,
                updated_at = now()
          where id = $1`,[t.subscription_id])}),t(`/admin/pagamentos`),t(`/admin/assinaturas`),t(`/admin`),{success:`Pagamento registrado.`}}catch(e){return{error:e instanceof Error?e.message:`Não foi possível registrar o pagamento.`}}}var D=a({id:l().uuid().optional().or(s(``)),name:l().trim().min(2,`Nome obrigatório.`),slug:l().trim().min(2,`Slug obrigatório.`).regex(/^[a-z0-9-]+$/,`Slug deve conter apenas letras minúsculas, números e hífens.`),description:l().trim().optional(),monthlyPrice:m().min(0),annualPrice:m().min(0),userLimit:m().int().min(0),professionalLimit:m().int().min(0),unitLimit:m().int().min(0),patientLimit:m().int().min(0),storageGb:m().int().min(0),aiInteractionLimit:m().int().min(0),messageLimit:m().int().min(0),trialDays:m().int().min(0),sortOrder:m().int().min(0),isActive:h()});async function O(e,i){let a=await n(),o=D.safeParse({id:i.get(`id`)||void 0,name:i.get(`name`),slug:i.get(`slug`),description:i.get(`description`)||void 0,monthlyPrice:i.get(`monthlyPrice`),annualPrice:i.get(`annualPrice`),userLimit:i.get(`userLimit`),professionalLimit:i.get(`professionalLimit`),unitLimit:i.get(`unitLimit`),patientLimit:i.get(`patientLimit`),storageGb:i.get(`storageGb`),aiInteractionLimit:i.get(`aiInteractionLimit`),messageLimit:i.get(`messageLimit`),trialDays:i.get(`trialDays`),sortOrder:i.get(`sortOrder`),isActive:i.get(`isActive`)===`on`});if(!o.success)return{error:o.error.issues[0]?.message??`Dados inválidos.`};let s=o.data;try{return await r(a.id,async e=>{s.id?await e.query(`update plans
              set name = $2,
                  slug = $3,
                  description = $4,
                  monthly_price = $5,
                  annual_price = $6,
                  user_limit = $7,
                  professional_limit = $8,
                  unit_limit = $9,
                  patient_limit = $10,
                  storage_gb = $11,
                  ai_interaction_limit = $12,
                  message_limit = $13,
                  trial_days = $14,
                  is_active = $15,
                  sort_order = $16,
                  updated_at = now()
            where id = $1`,[s.id,s.name,s.slug,s.description??null,s.monthlyPrice,s.annualPrice,s.userLimit,s.professionalLimit,s.unitLimit,s.patientLimit,s.storageGb,s.aiInteractionLimit,s.messageLimit,s.trialDays,s.isActive,s.sortOrder]):await e.query(`insert into plans
             (name, slug, description, monthly_price, annual_price,
              user_limit, professional_limit, unit_limit, patient_limit,
              storage_gb, ai_interaction_limit, message_limit, trial_days,
              is_active, sort_order)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,[s.name,s.slug,s.description??null,s.monthlyPrice,s.annualPrice,s.userLimit,s.professionalLimit,s.unitLimit,s.patientLimit,s.storageGb,s.aiInteractionLimit,s.messageLimit,s.trialDays,s.isActive,s.sortOrder])}),t(`/admin/planos`),{success:s.id?`Plano atualizado.`:`Plano criado.`}}catch(e){return{error:e instanceof Error?e.message.includes(`plans_slug_key`)?`Já existe um plano com este slug.`:`Não foi possível salvar o plano: ${e.message}`:`Não foi possível salvar o plano.`}}}async function k(e){let i=await n(),a=String(e.get(`moduleId`)??``),o=String(e.get(`next`)??``);!a||o!==`true`&&o!==`false`||(await r(i.id,async e=>{await e.query(`update modules set is_active = $2, updated_at = now() where id = $1`,[a,o===`true`])}),t(`/admin/modulos`),t(`/admin`),t(`/app`,`layout`))}var A=a({platformName:l().trim().min(2,`Nome obrigatório.`),supportEmail:l().trim().email(`E-mail de suporte inválido.`),defaultTrialDays:m().int().min(0),defaultGateway:u([`manual`,`stripe`,`asaas`,`pagseguro`,`mercadopago`]),defaultPeriodicity:u([`mensal`,`anual`]),whatsappMode:u([`manual`,`meta`])});async function j(e,i){let a=await n(),o=A.safeParse({platformName:i.get(`platformName`),supportEmail:i.get(`supportEmail`),defaultTrialDays:i.get(`defaultTrialDays`),defaultGateway:i.get(`defaultGateway`),defaultPeriodicity:i.get(`defaultPeriodicity`),whatsappMode:i.get(`whatsappMode`)});if(!o.success)return{error:o.error.issues[0]?.message??`Dados inválidos.`};let s=o.data,c=[[`platform.name`,{value:s.platformName}],[`platform.support_email`,{value:s.supportEmail}],[`platform.default_trial_days`,{value:s.defaultTrialDays}],[`platform.default_gateway`,{value:s.defaultGateway}],[`platform.default_periodicity`,{value:s.defaultPeriodicity}],[`platform.whatsapp_mode`,{value:s.whatsappMode}]];try{return await r(a.id,async e=>{for(let[t,n]of c)await e.query(`insert into platform_settings (key, value, updated_by, updated_at)
           values ($1, $2::jsonb, $3, now())
           on conflict (key) do update
             set value = excluded.value,
                 updated_by = excluded.updated_by,
                 updated_at = now()`,[t,JSON.stringify(n),a.id])}),t(`/admin/configuracoes`),{success:`Configurações salvas.`}}catch(e){return{error:e instanceof Error?`Não foi possível salvar: ${e.message}`:`Não foi possível salvar as configurações.`}}}async function M(e){let i=await n(),a=String(e.get(`clinicId`)??``),o=String(e.get(`membershipId`)??``);try{await r(i.id,async e=>{if((await e.query(`select role::text as role from clinic_memberships where id = $1 and clinic_id = $2`,[o,a]))[0]?.role===`clinic_admin`&&((await e.query(`select count(*)::int as total from clinic_memberships where clinic_id = $1 and role = 'clinic_admin' and status = 'ativo'`,[a]))[0]?.total??0)<=1)throw Error(`Nao e possivel suspender o ultimo administrador da clinica.`);await e.query(`update clinic_memberships set status = 'suspenso', updated_at = now() where id = $1 and clinic_id = $2`,[o,a])}),t(`/admin/clinicas/`+a)}catch{}}async function N(e){let i=await n(),a=String(e.get(`clinicId`)??``),o=String(e.get(`membershipId`)??``);try{await r(i.id,async e=>{await e.query(`update clinic_memberships set status = 'ativo', updated_at = now() where id = $1 and clinic_id = $2`,[o,a])}),t(`/admin/clinicas/`+a)}catch{}}e(y,`7cde87bf99fa`,`createClinicAction`),e(b,`7cde87bf99fa`,`toggleClinicStatusAction`),e(S,`7cde87bf99fa`,`changeSubscriptionPlanAction`),e(C,`7cde87bf99fa`,`addClinicModuleAction`),e(w,`7cde87bf99fa`,`removeClinicModuleAction`),e(T,`7cde87bf99fa`,`generateInvoiceAction`),e(E,`7cde87bf99fa`,`registerPaymentAction`),e(O,`7cde87bf99fa`,`savePlanAction`),e(k,`7cde87bf99fa`,`toggleModuleGlobalAction`),e(j,`7cde87bf99fa`,`savePlatformSettingsAction`),e(M,`7cde87bf99fa`,`suspendClinicMemberAction`),e(N,`7cde87bf99fa`,`reactivateClinicMemberAction`);export{C as addClinicModuleAction,S as changeSubscriptionPlanAction,y as createClinicAction,T as generateInvoiceAction,N as reactivateClinicMemberAction,E as registerPaymentAction,w as removeClinicModuleAction,O as savePlanAction,j as savePlatformSettingsAction,M as suspendClinicMemberAction,b as toggleClinicStatusAction,k as toggleModuleGlobalAction};
//# sourceMappingURL=actions-B3kbnv0l.js.map