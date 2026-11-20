import{r as e}from"./db-DIZA_RBl.js";async function t(t,n){return e({userId:t,clinicId:n},async e=>(await e.query(`select p.id,
              p.full_name,
              p.council,
              p.council_number,
              p.council_state,
              p.specialties,
              p.phone,
              p.email,
              p.consultation_price::text as consultation_price,
              p.default_duration_min,
              p.commission_percent::text as commission_percent,
              p.calendar_color,
              p.status::text as status,
              coalesce(array_agg(pu.unit_id) filter (where pu.unit_id is not null), '{}') as unit_ids,
              coalesce(array_agg(u.name) filter (where u.name is not null), '{}') as unit_names
         from professionals p
         left join professional_units pu on pu.professional_id = p.id
         left join clinic_units u on u.id = pu.unit_id
        group by p.id
        order by p.full_name`)).map(e=>({...e,unit_ids:e.unit_ids??[],unit_names:e.unit_names??[]})))}async function n(t,n,r){return e({userId:t,clinicId:n},async e=>{let t=(await e.query(`select p.id,
              p.full_name,
              p.council,
              p.council_number,
              p.council_state,
              p.specialties,
              p.phone,
              p.email,
              p.consultation_price::text as consultation_price,
              p.default_duration_min,
              p.commission_percent::text as commission_percent,
              p.calendar_color,
              p.status::text as status,
              p.user_id::text as user_id,
              p.notes,
              coalesce(array_agg(pu.unit_id) filter (where pu.unit_id is not null), '{}') as unit_ids,
              coalesce(array_agg(u.name) filter (where u.name is not null), '{}') as unit_names,
              p.created_at::text as created_at,
              p.updated_at::text as updated_at
         from professionals p
         left join professional_units pu on pu.professional_id = p.id
         left join clinic_units u on u.id = pu.unit_id
        where p.id = $1
        group by p.id`,[r]))[0];return t?{...t,unit_ids:t.unit_ids??[],unit_names:t.unit_names??[]}:null})}export{t as n,n as t};
//# sourceMappingURL=professionals-B_FODUTg.js.map