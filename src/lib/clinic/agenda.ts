import 'server-only';

import { withTenant } from '@/lib/db';

export interface AppointmentDetail {
  id: string;
  unit_id: string;
  unit_name: string;
  patient_id: string;
  patient_name: string;
  professional_id: string;
  professional_name: string;
  professional_color: string;
  type: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  checked_in_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  payment_method: string;
  amount: string;
  notes: string | null;
  cancellation_reason: string | null;
}

export interface BlockItem {
  id: string;
  professional_id: string;
  professional_name: string;
  unit_id: string | null;
  unit_name: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
}

export interface WaitingListItem {
  id: string;
  unit_id: string;
  unit_name: string;
  patient_id: string;
  patient_name: string;
  professional_id: string | null;
  professional_name: string | null;
  priority: number;
  desired_from: string | null;
  desired_to: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

const APPOINTMENT_COLUMNS = `
  a.id,
  a.unit_id,
  u.name as unit_name,
  a.patient_id,
  p.full_name as patient_name,
  a.professional_id,
  pr.full_name as professional_name,
  pr.calendar_color as professional_color,
  a.type::text as type,
  a.status::text as status,
  a.scheduled_start::text as scheduled_start,
  a.scheduled_end::text as scheduled_end,
  a.checked_in_at::text as checked_in_at,
  a.started_at::text as started_at,
  a.finished_at::text as finished_at,
  a.payment_method::text as payment_method,
  a.amount::text as amount,
  a.notes,
  a.cancellation_reason
`;

export async function getDayAgenda(
  userId: string,
  clinicId: string,
  options: {
    date: string;
    professionalId?: string;
    unitId?: string;
  },
): Promise<AppointmentDetail[]> {
  const { date, professionalId, unitId } = options;
  return withTenant({ userId, clinicId }, async (tx) => {
    const params: unknown[] = [date];
    const conditions: string[] = [
      `a.scheduled_start >= $1::date`,
      `a.scheduled_start < ($1::date + interval '1 day')`,
    ];
    if (professionalId) {
      params.push(professionalId);
      conditions.push(`a.professional_id = $${params.length}::uuid`);
    }
    if (unitId) {
      params.push(unitId);
      conditions.push(`a.unit_id = $${params.length}::uuid`);
    }

    return tx.query<AppointmentDetail>(
      `select ${APPOINTMENT_COLUMNS}
         from appointments a
         join clinic_units u on u.id = a.unit_id
         join patients p on p.id = a.patient_id
         join professionals pr on pr.id = a.professional_id
        where ${conditions.join(' and ')}
        order by a.scheduled_start`,
      params,
    );
  });
}

export async function getWeekAgenda(
  userId: string,
  clinicId: string,
  options: {
    date: string;
    professionalId?: string;
    unitId?: string;
  },
): Promise<AppointmentDetail[]> {
  const { date, professionalId, unitId } = options;
  return withTenant({ userId, clinicId }, async (tx) => {
    const start = new Date(`${date}T00:00:00`);
    const dayOfWeek = start.getDay();
    const monday = new Date(start);
    monday.setDate(start.getDate() - ((dayOfWeek + 6) % 7));
    const mondayIso = monday.toISOString().slice(0, 10);
    const sundayIso = new Date(monday.getTime() + 6 * 86400000)
      .toISOString()
      .slice(0, 10);

    const params: unknown[] = [mondayIso, sundayIso];
    const conditions: string[] = [
      `a.scheduled_start >= $1::date`,
      `a.scheduled_start < ($2::date + interval '1 day')`,
    ];
    if (professionalId) {
      params.push(professionalId);
      conditions.push(`a.professional_id = $${params.length}::uuid`);
    }
    if (unitId) {
      params.push(unitId);
      conditions.push(`a.unit_id = $${params.length}::uuid`);
    }

    return tx.query<AppointmentDetail>(
      `select ${APPOINTMENT_COLUMNS}
         from appointments a
         join clinic_units u on u.id = a.unit_id
         join patients p on p.id = a.patient_id
         join professionals pr on pr.id = a.professional_id
        where ${conditions.join(' and ')}
        order by a.scheduled_start`,
      params,
    );
  });
}

export async function getRangeAgenda(
  userId: string,
  clinicId: string,
  options: {
    from: string;
    to: string;
    professionalId?: string;
  },
): Promise<AppointmentDetail[]> {
  const { from, to, professionalId } = options;
  return withTenant({ userId, clinicId }, async (tx) => {
    const params: unknown[] = [from, to];
    const conditions: string[] = [
      `a.scheduled_start >= $1::date`,
      `a.scheduled_start < ($2::date + interval '1 day')`,
    ];
    if (professionalId) {
      params.push(professionalId);
      conditions.push(`a.professional_id = $${params.length}::uuid`);
    }
    return tx.query<AppointmentDetail>(
      `select ${APPOINTMENT_COLUMNS}
         from appointments a
         join clinic_units u on u.id = a.unit_id
         join patients p on p.id = a.patient_id
         join professionals pr on pr.id = a.professional_id
        where ${conditions.join(' and ')}
        order by a.scheduled_start`,
      params,
    );
  });
}

export async function getAppointment(
  userId: string,
  clinicId: string,
  appointmentId: string,
): Promise<AppointmentDetail | null> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<AppointmentDetail>(
      `select ${APPOINTMENT_COLUMNS}
         from appointments a
         join clinic_units u on u.id = a.unit_id
         join patients p on p.id = a.patient_id
         join professionals pr on pr.id = a.professional_id
        where a.id = $1`,
      [appointmentId],
    );
    return rows[0] ?? null;
  });
}

export async function listBlocks(
  userId: string,
  clinicId: string,
  professionalId?: string,
): Promise<BlockItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (professionalId) {
      params.push(professionalId);
      conditions.push(`sb.professional_id = $${params.length}::uuid`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
    return tx.query<BlockItem>(
      `select sb.id,
              sb.professional_id,
              pr.full_name as professional_name,
              sb.unit_id,
              u.name as unit_name,
              sb.starts_at::text as starts_at,
              sb.ends_at::text as ends_at,
              sb.reason,
              sb.created_at::text as created_at
         from schedule_blocks sb
         join professionals pr on pr.id = sb.professional_id
         left join clinic_units u on u.id = sb.unit_id
         ${where}
        order by sb.starts_at desc`,
      params,
    );
  });
}

export async function listWaitingList(
  userId: string,
  clinicId: string,
  status?: string,
): Promise<WaitingListItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (status) {
      params.push(status);
      conditions.push(`wl.status = $${params.length}`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
    return tx.query<WaitingListItem>(
      `select wl.id,
              wl.unit_id,
              u.name as unit_name,
              wl.patient_id,
              p.full_name as patient_name,
              wl.professional_id,
              pr.full_name as professional_name,
              wl.priority,
              wl.desired_from::text as desired_from,
              wl.desired_to::text as desired_to,
              wl.notes,
              wl.status::text as status,
              wl.created_at::text as created_at
         from waiting_list wl
         join clinic_units u on u.id = wl.unit_id
         join patients p on p.id = wl.patient_id
         left join professionals pr on pr.id = wl.professional_id
         ${where}
        order by wl.priority asc, wl.created_at`,
      params,
    );
  });
}

export async function listAppointmentsForPatient(
  userId: string,
  clinicId: string,
  patientId: string,
): Promise<Array<{ id: string; scheduled_start: string; type: string }>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<{ id: string; scheduled_start: string; type: string }>(
      `select id, scheduled_start::text as scheduled_start, type::text as type
         from appointments
        where patient_id = $1
        order by scheduled_start desc
        limit 50`,
      [patientId],
    );
  });
}
export async function getAppointmentStatusHistory(
  userId: string,
  clinicId: string,
  appointmentId: string,
): Promise<
  Array<{
    id: string;
    from_status: string | null;
    to_status: string;
    notes: string | null;
    created_at: string;
  }>
> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query(
      `select id,
              from_status::text as from_status,
              to_status::text as to_status,
              notes,
              created_at::text as created_at
         from appointment_status_history
        where appointment_id = $1
        order by created_at`,
      [appointmentId],
    );
  });
}
