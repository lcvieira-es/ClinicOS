import{P as e}from"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-request-stage-DrYePS94.js";import"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-rsc-entry~cache-callabl~h053e9lc-Bau50AnE.js";import{o as t}from"../../vinext-stage-runtime~0virtual_vinext-response-stage~0virtual_vinext-rsc-entry~cache-callabl~o4mewdgk-CpMeVdIn.js";import{t as n}from"./vinext-stage-runtime~page~page~page~page~page~page~page~page~page~page~page~page~page~page~~pbll4pnl-B1t1IQjD.js";import"../../vinext-stage-runtime~0virtual_vinext-response-stage-CsSQHvW5.js";import{r,t as i}from"./module-guard-DENMAsQa.js";import{r as a}from"./db-DIZA_RBl.js";import{i as o,n as s,r as c,t as l}from"./validation-DJCTKJZG.js";import{a as u,i as d,o as f}from"./schemas-BrTGXDGy.js";import{createHash as p,randomBytes as m}from"node:crypto";var h=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,g=f().trim().regex(h,`Identificador inválido.`).or(d(``)).optional(),_=u({patientId:f().trim().regex(h,`Paciente inválido.`),professionalId:f().trim().regex(h,`Profissional inválido.`),appointmentId:g,recordDate:f().trim().optional(),chiefComplaint:f().trim().optional(),historyPresentIllness:f().trim().optional(),physicalExam:f().trim().optional(),assessment:f().trim().optional(),plan:f().trim().optional(),icd10Codes:f().trim().optional(),notes:f().trim().optional()});function v(e){return(e??``).trim()||null}function y(e){return e?e.split(/[,\s]+/).map(e=>e.trim().toUpperCase()).filter(Boolean):[]}function b(e){let t=JSON.stringify(e,Object.keys(e).sort());return p(`sha256`).update(t).digest(`hex`)}function x(){return m(6).toString(`hex`).toUpperCase()}async function S(e,t){let i,o;try{let e=await r(`prontuarios`,`prontuarios:create`);i=e.user.id,o=e.user.activeClinicId}catch(e){if(c(e))throw e;return{error:s(e)}}let u=_.safeParse(Object.fromEntries(t));if(!u.success)return{error:u.error.issues[0]?.message??`Dados inválidos.`};let d=u.data;try{let e=await a({userId:i,clinicId:o},async e=>{let t=(await e.query(`insert into medical_records (
           clinic_id, patient_id, professional_id, appointment_id, record_date,
           chief_complaint, history_present_illness, physical_exam, assessment,
           plan, icd10_codes, notes, status, version, created_by
         ) values (
           $1, $2::uuid, $3::uuid, $4::uuid, coalesce($5::timestamptz, now()),
           $6, $7, $8, $9,
           $10, $11::text[], $12, 'rascunho', 1, $13::uuid
         )
         returning id`,[o,d.patientId,d.professionalId,v(d.appointmentId)||null,v(d.recordDate)||null,v(d.chiefComplaint),v(d.historyPresentIllness),v(d.physicalExam),v(d.assessment),v(d.plan),y(d.icd10Codes),v(d.notes),i]))[0]?.id;if(!t)throw new l(`Não foi possível criar o prontuário.`);return t});return n(`/app/prontuarios`),n(`/app/prontuarios/${e}`),{success:`Prontuário criado como rascunho.`,id:e}}catch(e){if(c(e))throw e;return{error:s(e)}}}async function C(e,t){let i,u;try{let e=await r(`prontuarios`,`prontuarios:edit`);i=e.user.id,u=e.user.activeClinicId}catch(e){if(c(e))throw e;return{error:s(e)}}let d=String(t.get(`recordId`)??``);if(!o(d))return{error:`Prontuário inválido.`};let f=_.safeParse(Object.fromEntries(t));if(!f.success)return{error:f.error.issues[0]?.message??`Dados inválidos.`};let p=f.data;try{return await a({userId:i,clinicId:u},async e=>{let t=await e.query(`select status::text as status, professional_id::text as professional_id
           from medical_records where id = $1`,[d]);if(t.length===0)throw new l(`Prontuário não encontrado.`);if(t[0].status!==`rascunho`)throw new l(`Apenas rascunhos podem ser editados. Use retificação para alterar um documento assinado.`);let n=y(p.icd10Codes);await e.query(`update medical_records set
           patient_id = $2::uuid,
           professional_id = $3::uuid,
           appointment_id = $4::uuid,
           record_date = coalesce($5::timestamptz, record_date),
           chief_complaint = $6,
           history_present_illness = $7,
           physical_exam = $8,
           assessment = $9,
           plan = $10,
           icd10_codes = $11::text[],
           notes = $12,
           updated_at = now()
         where id = $1`,[d,p.patientId,p.professionalId,v(p.appointmentId)||null,v(p.recordDate)||null,v(p.chiefComplaint),v(p.historyPresentIllness),v(p.physicalExam),v(p.assessment),v(p.plan),n,v(p.notes)])}),n(`/app/prontuarios`),n(`/app/prontuarios/${d}`),{success:`Prontuário atualizado.`,id:d}}catch(e){if(c(e))throw e;return{error:s(e)}}}async function w(t){let r=String(t.get(`recordId`)??``),u=`/app/prontuarios/${r}`,d=await i(`prontuarios`,`prontuarios:sign`,`/app/prontuarios`);o(r)||e(`/app/prontuarios?erro=Prontu%C3%A1rio%20inv%C3%A1lido.`);try{await a({userId:d.user.id,clinicId:d.user.activeClinicId},async e=>{let t=await e.query(`select status::text as status,
                  professional_id::text as professional_id,
                  chief_complaint,
                  history_present_illness,
                  physical_exam,
                  assessment,
                  plan,
                  icd10_codes,
                  notes
             from medical_records where id = $1`,[r]);if(t.length===0)throw new l(`Prontuário não encontrado.`);let n=t[0];if(n.status!==`rascunho`)throw new l(`Apenas rascunhos podem ser assinados.`);let i=n.professional_id===(await e.query(`select app_professional_id($1) as id`,[d.user.activeClinicId]))[0]?.id;if(d.user.activeMembership.role!==`clinic_admin`&&!i)throw new l(`Apenas o profissional responsável pode assinar este prontuário.`);let a=n.icd10_codes??[],o=b({chiefComplaint:n.chief_complaint,historyPresentIllness:n.history_present_illness,physicalExam:n.physical_exam,assessment:n.assessment,plan:n.plan,icd10Codes:a,notes:n.notes}),s=x(),c=new Date().toISOString(),u=p(`sha256`).update(`${o}|${d.user.id}|${c}`).digest(`hex`);await e.query(`update medical_records set
             status = 'assinado',
             signed_at = $2::timestamptz,
             signed_by = $3::uuid,
             content_hash = $4,
             signature_hash = $5,
             signature_method = 'interno_hash',
             verification_code = $6,
             updated_at = now()
           where id = $1`,[r,c,d.user.id,o,u,s]),await e.query(`insert into record_access_logs (clinic_id, medical_record_id, user_id, action)
           values ($1, $2::uuid, $3::uuid, 'sign')`,[d.user.activeClinicId,r,d.user.id])}),n(`/app/prontuarios`),n(u),e(`${u}?msg=Prontu%C3%A1rio%20assinado%20com%20sucesso.`)}catch(t){if(c(t))throw t;e(`${u}?erro=${encodeURIComponent(s(t))}`)}}async function T(t){let r=String(t.get(`recordId`)??``),u=`/app/prontuarios/${r}`,d=await i(`prontuarios`,`prontuarios:edit`,`/app/prontuarios`);o(r)||e(`/app/prontuarios?erro=Prontu%C3%A1rio%20inv%C3%A1lido.`);try{let t=await a({userId:d.user.id,clinicId:d.user.activeClinicId},async e=>{let t=await e.query(`select patient_id::text as patient_id,
                  professional_id::text as professional_id,
                  appointment_id::text as appointment_id,
                  status::text as status,
                  version,
                  chief_complaint,
                  history_present_illness,
                  physical_exam,
                  assessment,
                  plan,
                  icd10_codes,
                  notes
             from medical_records where id = $1`,[r]);if(t.length===0)throw new l(`Prontuário não encontrado.`);let n=t[0];if(n.status!==`assinado`)throw new l(`Apenas documentos assinados podem ser retificados.`);await e.query(`update medical_records set status = 'retificado', updated_at = now() where id = $1`,[r]);let i=(await e.query(`insert into medical_records (
             clinic_id, patient_id, professional_id, appointment_id, record_date,
             chief_complaint, history_present_illness, physical_exam, assessment,
             plan, icd10_codes, notes, status, version, parent_id, created_by
           ) values (
             $1, $2::uuid, $3::uuid, $4::uuid, now(),
             $5, $6, $7, $8,
             $9, $10::text[], $11, 'rascunho', $12, $13::uuid, $14::uuid
           )
           returning id`,[d.user.activeClinicId,n.patient_id,n.professional_id,n.appointment_id,n.chief_complaint,n.history_present_illness,n.physical_exam,n.assessment,n.plan,n.icd10_codes??[],n.notes,n.version+1,r,d.user.id]))[0]?.id;if(!i)throw new l(`Não foi possível criar a retificação.`);return i});n(`/app/prontuarios`),e(`/app/prontuarios/${t}?msg=Retifica%C3%A7%C3%A3o%20criada%20como%20novo%20rascunho.`)}catch(t){if(c(t))throw t;e(`${u}?erro=${encodeURIComponent(s(t))}`)}}async function E(t){let r=String(t.get(`recordId`)??``),u=String(t.get(`noteType`)??`evolucao`),d=String(t.get(`content`)??``).trim(),f=await i(`prontuarios`,`prontuarios:create`,`/app/prontuarios`);o(r)&&d||e(`/app/prontuarios?erro=Dados%20inv%C3%A1lidos.`);try{await a({userId:f.user.id,clinicId:f.user.activeClinicId},async e=>{let t=await e.query(`select patient_id::text as patient_id from medical_records where id = $1`,[r]);if(t.length===0)throw new l(`Prontuário não encontrado.`);await e.query(`insert into clinical_notes
             (clinic_id, medical_record_id, patient_id, professional_id, note_type, content, status, created_by)
           values ($1, $2::uuid, $3::uuid, $4::uuid, $5::clinical_note_type, $6, 'rascunho', $7::uuid)`,[f.user.activeClinicId,r,t[0].patient_id,(await e.query(`select app_professional_id($1) as id`,[f.user.activeClinicId]))[0]?.id??null,u,d,f.user.id])}),n(`/app/prontuarios/${r}`),e(`/app/prontuarios/${r}?msg=Nota%20adicionada.`)}catch(t){if(c(t))throw t;e(`/app/prontuarios/${r}?erro=${encodeURIComponent(s(t))}`)}}async function D(t){let r=String(t.get(`patientId`)??``),l=String(t.get(`substance`)??``).trim(),u=String(t.get(`reaction`)??``).trim(),d=String(t.get(`severity`)??`moderada`),f=String(t.get(`notes`)??``).trim(),p=await i(`prontuarios`,`prontuarios:edit`,`/app/prontuarios`);o(r)&&l||e(`/app/prontuarios?erro=Dados%20inv%C3%A1lidos.`);try{await a({userId:p.user.id,clinicId:p.user.activeClinicId},e=>e.query(`insert into allergies (clinic_id, patient_id, substance, reaction, severity, notes, status, noted_by)
           values ($1, $2::uuid, $3, $4, $5::allergy_severity, $6, 'ativo', $7::uuid)`,[p.user.activeClinicId,r,l,u||null,d,f||null,p.user.id])),n(`/app/pacientes/${r}`),e(`/app/pacientes/${r}?msg=Alergia%20registrada.`)}catch(t){if(c(t))throw t;e(`/app/pacientes/${r}?erro=${encodeURIComponent(s(t))}`)}}async function O(t){let r=String(t.get(`allergyId`)??``),l=String(t.get(`patientId`)??``),u=await i(`prontuarios`,`prontuarios:edit`,`/app/prontuarios`);o(r)||e(`/app/pacientes/${l}?erro=Alergia%20inv%C3%A1lida.`);try{await a({userId:u.user.id,clinicId:u.user.activeClinicId},e=>e.query(`delete from allergies where id = $1`,[r])),n(`/app/pacientes/${l}`),e(`/app/pacientes/${l}?msg=Alergia%20removida.`)}catch(t){if(c(t))throw t;e(`/app/pacientes/${l}?erro=${encodeURIComponent(s(t))}`)}}t(S,`56201740fb12`,`createMedicalRecordAction`),t(C,`56201740fb12`,`updateMedicalRecordAction`),t(w,`56201740fb12`,`signMedicalRecordAction`),t(T,`56201740fb12`,`rectifyMedicalRecordAction`),t(E,`56201740fb12`,`addClinicalNoteAction`),t(D,`56201740fb12`,`addAllergyAction`),t(O,`56201740fb12`,`deleteAllergyAction`);export{D as addAllergyAction,E as addClinicalNoteAction,S as createMedicalRecordAction,O as deleteAllergyAction,T as rectifyMedicalRecordAction,w as signMedicalRecordAction,C as updateMedicalRecordAction};
//# sourceMappingURL=prontuarios-DzkDgm8k.js.map