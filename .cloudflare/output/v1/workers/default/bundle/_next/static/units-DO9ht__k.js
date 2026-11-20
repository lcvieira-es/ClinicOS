import{r as e}from"./db-DIZA_RBl.js";async function t(t,n){return e({userId:t,clinicId:n},async e=>e.query(`select u.id,
              u.name,
              u.type::text as type,
              u.internal_code,
              u.phone,
              u.email,
              u.cep,
              u.address,
              u.address_number,
              u.complement,
              u.neighborhood,
              u.city,
              u.state::text as state,
              u.manager_name,
              u.opening_hours,
              u.is_headquarters,
              u.status::text as status,
              (select count(*)::int
                 from professional_units pu
                where pu.unit_id = u.id) as professional_count
         from clinic_units u
        order by u.is_headquarters desc, u.name`))}async function n(t,n,r){return e({userId:t,clinicId:n},async e=>(await e.query(`select u.id,
              u.name,
              u.type::text as type,
              u.internal_code,
              u.phone,
              u.email,
              u.cep,
              u.address,
              u.address_number,
              u.complement,
              u.neighborhood,
              u.city,
              u.state::text as state,
              u.manager_name,
              u.opening_hours,
              u.is_headquarters,
              u.status::text as status,
              (select count(*)::int
                 from professional_units pu
                where pu.unit_id = u.id) as professional_count,
              u.created_at::text as created_at,
              u.updated_at::text as updated_at
         from clinic_units u
        where u.id = $1`,[r]))[0]??null)}export{t as n,n as t};
//# sourceMappingURL=units-DO9ht__k.js.map