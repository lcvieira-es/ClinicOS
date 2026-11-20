import{P as e}from"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-request-stage-DrYePS94.js";import"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-rsc-entry~cache-callabl~h053e9lc-Bau50AnE.js";import{o as t}from"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-rsc-entry~cache-callabl~o4mewdgk-CpMeVdIn.js";import{t as n}from"./vinext-stage-runtime~page~page~page~page~page~page~page~page~page~page~page~page~page~page~~pbll4pnl-B1t1IQjD.js";import"../../vinext-stage-runtime~0virtual_vinext-response-stage-CsSQHvW5.js";import{r}from"./module-guard-DENMAsQa.js";import{r as i}from"./db-DIZA_RBl.js";import{n as a,r as o}from"./validation-DJCTKJZG.js";import{a as s,i as c,o as l}from"./schemas-BrTGXDGy.js";var u=s({displayName:l().trim().min(2,`Nome de exibição obrigatório.`),tradeName:l().trim().optional(),email:l().trim().email(`E-mail inválido.`).or(c(``)).optional(),phone:l().trim().optional(),whatsapp:l().trim().optional(),cep:l().trim().optional(),address:l().trim().optional(),addressNumber:l().trim().optional(),complement:l().trim().optional(),neighborhood:l().trim().optional(),city:l().trim().optional(),state:l().trim().regex(/^[A-Z]{2}$/,`UF inválida.`).or(c(``)).optional(),notes:l().trim().optional()});function d(e){return(e??``).trim()||null}async function f(t){let s=await(async()=>{try{return await r(`configuracoes`,`configuracoes:edit`)}catch(t){if(o(t))throw t;e(`/app/configuracoes?erro=${encodeURIComponent(a(t))}`)}})(),c=u.safeParse(Object.fromEntries(t));c.success||e(`/app/configuracoes?erro=${encodeURIComponent(c.error.issues[0]?.message??`Dados inválidos.`)}`);let l=c.data;try{await i({userId:s.user.id,clinicId:s.user.activeClinicId},e=>e.query(`update clinics set
             display_name = $2,
             trade_name = $3,
             email = $4,
             phone = $5,
             whatsapp = $6,
             cep = $7,
             address = $8,
             address_number = $9,
             complement = $10,
             neighborhood = $11,
             city = $12,
             state = $13::char(2),
             notes = $14,
             updated_at = now()
           where id = $1`,[s.user.activeClinicId,l.displayName,d(l.tradeName),d(l.email),d(l.phone),d(l.whatsapp),d(l.cep),d(l.address),d(l.addressNumber),d(l.complement),d(l.neighborhood),d(l.city),d(l.state),d(l.notes)])),n(`/app/configuracoes`),e(`/app/configuracoes?msg=Configura%C3%A7%C3%B5es%20salvas.`)}catch(t){if(o(t))throw t;e(`/app/configuracoes?erro=${encodeURIComponent(a(t))}`)}}t(f,`9481756e1002`,`updateClinicSettingsAction`);export{f as updateClinicSettingsAction};
//# sourceMappingURL=configuracoes-BciLKOoF.js.map