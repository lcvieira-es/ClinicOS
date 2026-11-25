const fs = require('fs');
const file = 'src/lib/clinic/agenda.ts';
let c = fs.readFileSync(file, 'utf8');

// getDayAgenda: use LIKE on text representation
c = c.replace(
  "      `a.scheduled_start::date >= $1::date`,\n      `a.scheduled_start::date < ($1::date + interval '1 day')`,",
  "      `a.scheduled_start::text like ($1::text || '%')`,"
);

// getWeekAgenda: use LIKE range
c = c.replace(
  "      `(a.scheduled_start AT TIME ZONE 'America/Sao_Paulo')::date >= $1::date`,\n      `(a.scheduled_start AT TIME ZONE 'America/Sao_Paulo')::date < ($2::date + interval '1 day')`,",
  "      `a.scheduled_start::text >= ($1::text || ' 00:00:00')`,\n      `a.scheduled_start::text < ($2::text || ' 23:59:59')`"
);

// getRangeAgenda: use LIKE range  
c = c.replace(
  "      `(a.scheduled_start AT TIME ZONE 'America/Sao_Paulo')::date >= $1::date`,\n      `(a.scheduled_start AT TIME ZONE 'America/Sao_Paulo')::date < ($2::date + interval '1 day')`,",
  "      `a.scheduled_start::text >= ($1::text || ' 00:00:00')`,\n      `a.scheduled_start::text < ($2::text || ' 23:59:59')`"
);

fs.writeFileSync(file, c, 'utf8');
console.log('done');
console.log('LIKE count:', (c.match(/scheduled_start::text like/g) || []).length);
console.log('AT TIME ZONE remaining:', (c.match(/AT TIME ZONE/g) || []).length);
console.log('scheduled_start::date remaining:', (c.match(/scheduled_start::date/g) || []).length);
