import{P as e}from"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-request-stage-DrYePS94.js";import"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-rsc-entry~cache-callabl~h053e9lc-Bau50AnE.js";import{o as t}from"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-rsc-entry~cache-callabl~o4mewdgk-CpMeVdIn.js";import"../../vinext-stage-runtime~0virtual_vinext-response-stage-CsSQHvW5.js";import{t as n}from"./db-DIZA_RBl.js";import{n as r}from"./password-CSjfbUfr.js";import{a as i,o as a}from"./schemas-BrTGXDGy.js";import{n as o,r as s,t as c}from"./current-user-k91s3vwz.js";var l=i({email:a().trim().min(1,`Informe o e-mail.`).email(`Informe um e-mail válido.`).transform(e=>e.toLowerCase()),password:a().min(1,`Informe a senha.`)});async function u(t,i){let a=l.safeParse({email:i.get(`email`),password:i.get(`password`)});if(!a.success)return{error:a.error.issues[0]?.message??`Dados inválidos.`,email:String(i.get(`email`)??``)};let{email:o,password:c}=a.data,u=(await n(`select u.id, u.email, u.password_hash, u.full_name, u.status,
              exists (
                select 1 from platform_admins pa
                where pa.user_id = u.id and pa.status = 'ativo'
              ) as is_platform_admin
         from users u
        where lower(u.email) = $1
        limit 1`,[o]))[0],d=await r(u?.password_hash,c);if(!u||!d)return{error:`E-mail ou senha inválidos.`,email:o};if(u.status!==`ativo`)return{error:`Esta conta está inativa. Procure o administrador da clínica.`,email:o};let[f,p]=await Promise.all([n(`select clinic_id
         from clinic_memberships
        where user_id = $1 and status = 'ativo'
        order by created_at
        limit 1`,[u.id]),n(`select clinic_id
         from patient_portal_access
        where user_id = $1 and status = 'ativo'
        order by granted_at
        limit 1`,[u.id])]),m=f[0]?.clinic_id??p[0]?.clinic_id??null;if(!u.is_platform_admin&&!m&&p.length===0)return{error:`Sua conta não possui vínculo ativo com uma clínica. Procure o administrador.`,email:o};await n(`update users set last_login_at = now(), updated_at = now() where id = $1`,[u.id]),await s({userId:u.id,clinicId:m}),u.is_platform_admin&&e(`/admin`),m&&e(`/app/painel`),e(`/portal`)}async function d(){await o(),e(`/login`)}async function f(t){let n=String(t.get(`clinicId`)??``),r=await c();r||e(`/login`);let i=r.memberships.find(e=>e.clinicId===n);i||e(`/app/painel`),await s({userId:r.id,clinicId:i.clinicId}),e(`/app/painel`)}t(u,`b2df40cfb33f`,`loginAction`),t(d,`b2df40cfb33f`,`logoutAction`),t(f,`b2df40cfb33f`,`switchClinicAction`);export{u as loginAction,d as logoutAction,f as switchClinicAction};
//# sourceMappingURL=actions-lv3-jW7o.js.map