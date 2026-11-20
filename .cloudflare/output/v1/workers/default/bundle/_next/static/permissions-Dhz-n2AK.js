import{n as e,r as t}from"./db-DIZA_RBl.js";async function n(e,n,r){return t({userId:e,clinicId:n},async e=>{let t=await e.query(`select p.key
         from permissions p
         join role_permissions rp on rp.permission_id = p.id
        where rp.role = $1
        order by p.key`,[r]);return new Set(t.map(e=>e.key))})}async function r(t){return e(t,async e=>{let t=await e.query(`select p.key
         from permissions p
         join role_permissions rp on rp.permission_id = p.id
        where rp.role = 'platform_admin'
        order by p.key`);return new Set(t.map(e=>e.key))})}export{n,r as t};
//# sourceMappingURL=permissions-Dhz-n2AK.js.map