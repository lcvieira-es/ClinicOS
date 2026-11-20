import{n as e}from"./module-guard-DENMAsQa.js";import{t}from"./access-restricted-DqK0ooye.js";import{r as n}from"./db-DIZA_RBl.js";import{a as r}from"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-rsc-entry~cache-callabl~o4mewdgk-CpMeVdIn.js";import{t as i}from"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-rsc-entry~page~page~pag~n6n7luxa-CNb9Zhsj.js";async function a(e,t){return n({userId:e,clinicId:t},async e=>e.query(`select wm.id,
              wm.patient_id,
              p.full_name as patient_name,
              wm.direction::text as direction,
              wm.template,
              wm.content,
              wm.status::text as status,
              wm.sent_at::text as sent_at,
              wm.created_at::text as created_at
         from whatsapp_messages wm
         left join patients p on p.id = wm.patient_id
        order by wm.created_at desc
        limit 100`))}async function o(e,t){return n({userId:e,clinicId:t},async e=>e.query(`select id, full_name as name, phone from patients where status <> 'arquivado' order by full_name`))}var s=r(()=>{throw Error(`Unexpectedly client reference export 'default' is called on server`)},`a9a69b70889a`,`default`),c=i(),l={title:`WhatsApp`};async function u(){let n=await e(`whatsapp`);if(!n.allowed)return(0,c.jsx)(t,{homeHref:`/app/painel`,homeLabel:`Voltar ao painel`});let r=n.user,[i,l]=await Promise.all([a(r.id,r.activeClinicId),o(r.id,r.activeClinicId)]);return(0,c.jsx)(s,{messages:i,patients:l})}export{u as default,l as metadata};
//# sourceMappingURL=page-DXM6h7Ud.js.map