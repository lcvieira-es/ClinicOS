import 'server-only';

import { withTenant } from '@/lib/db';

export interface ProfessionalSchedule {
  professional_id: string;
  unit_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
}

export async function listSchedulesForClinic(
  userId: string,
  clinicId: string,
): Promise<ProfessionalSchedule[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<ProfessionalSchedule>(
      `select professional_id::text as professional_id,
              unit_id::text as unit_id,
              weekday::int as weekday,
              start_time::text as start_time,
              end_time::text as end_time,
              slot_minutes
         from professional_schedules
        where is_active = true
        order by professional_id, weekday, start_time`,
    );
  });
}

export async function listBusySlotsForProfessionals(
  userId: string,
  clinicId: string,
  professionalIds: string[],
): Promise<Array<{ professional_id: string; scheduled_start: string; scheduled_end: string }>> {
  if (professionalIds.length === 0) return [];
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<{ professional_id: string; scheduled_start: string; scheduled_end: string }>(
      `select professional_id::text as professional_id,
              scheduled_start::text as scheduled_start,
              scheduled_end::text as scheduled_end
         from appointments
        where professional_id = any($1::uuid[])
          and status <> 'cancelada'
          and scheduled_start >= current_date`,
      [professionalIds],
    );
  });
}
