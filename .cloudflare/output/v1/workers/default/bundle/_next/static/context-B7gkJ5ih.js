import{r as e}from"./rolldown-runtime-XKyaHtl9.js";import{I as t}from"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-request-stage-DrYePS94.js";import{r as n}from"./db-DIZA_RBl.js";import{n as r}from"./permissions-Dhz-n2AK.js";var i=e(t(),1);async function a(e,t){return n({userId:e,clinicId:t},async e=>(await e.query(`select distinct m.key, m.name, m.route, m.icon, m.category::text as category, m.is_core
         from modules m
        where m.audience = 'clinica'
          and m.is_active = true
          and (
            m.is_core = true
            or exists (
              select 1
                from clinic_modules cm
               where cm.clinic_id = $1
                 and cm.module_id = m.id
                 and cm.enabled = true
                 and (cm.expires_at is null or cm.expires_at > now())
            )
          )
        order by m.key`,[t])).map(e=>({key:e.key,name:e.name,route:e.route,icon:e.icon,category:e.category,isCore:e.is_core})))}function o(e){return new Set(e.map(e=>e.key))}var s=(0,i.cache)(async(e,t,n)=>{let[i,s]=await Promise.all([a(e,t),r(e,t,n)]);return{entitlements:i,permissions:s,modules:o(i)}});export{a as n,s as t};
//# sourceMappingURL=context-B7gkJ5ih.js.map