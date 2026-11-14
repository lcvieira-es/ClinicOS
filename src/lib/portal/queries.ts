import 'server-only';

import { withTenant } from '@/lib/db';

export interface PortalProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  lgpd_consent_at: string | null;
}

export interface PortalAppointment {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  type: string;
  amount: string;
  professional_name: string;
  unit_name: string;
}

export interface PortalResult {
  id: string;
  result_summary: string | null;
  result_text: string | null;
  released_at: string | null;
  order_date: string;
  professional_name: string;
  exam_names: string | null;
}

export interface PortalPrescription {
  id: string;
  type: string;
  status: string;
  issued_at: string | null;
  verification_code: string | null;
  medication_names: string | null;
}

export interface PortalDocument {
  id: string;
  title: string;
  document_type: string;
  created_at: string;
}

export interface PortalOverview {
  profile: PortalProfile | null;
  nextAppointment: PortalAppointment | null;
  appointments: PortalAppointment[];
  latestResults: PortalResult[];
  prescriptions: PortalPrescription[];
  documents: PortalDocument[];
  completedAppointments: number;
  pendingExams: number;
  releasedResults: number;
}

export async function getPortalOverview(
  userId: string,
  clinicId: string,
  patientId: string,
): Promise<PortalOverview> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const profileRows = await tx.query<PortalProfile>(
      `select id, full_name, email, phone, birth_date, lgpd_consent_at
         from patients
        where id = $1
        limit 1`,
      [patientId],
    );

    const appointmentRows = await tx.query<PortalAppointment>(
      `select a.id,
              a.scheduled_start,
              a.scheduled_end,
              a.status::text as status,
              a.type::text as type,
              a.amount::text as amount,
              pr.full_name as professional_name,
              u.name as unit_name
         from appointments a
         join professionals pr on pr.id = a.professional_id
         join clinic_units u on u.id = a.unit_id
        where a.patient_id = $1
        order by a.scheduled_start desc
        limit 20`,
      [patientId],
    );

    const nextRows = await tx.query<PortalAppointment>(
      `select a.id,
              a.scheduled_start,
              a.scheduled_end,
              a.status::text as status,
              a.type::text as type,
              a.amount::text as amount,
              pr.full_name as professional_name,
              u.name as unit_name
         from appointments a
         join professionals pr on pr.id = a.professional_id
         join clinic_units u on u.id = a.unit_id
        where a.patient_id = $1
          and a.scheduled_start >= now()
          and a.status not in ('cancelada', 'faltou', 'realizada')
        order by a.scheduled_start
        limit 1`,
      [patientId],
    );

    const resultRows = await tx.query<PortalResult>(
      `select er.id,
              er.result_summary,
              er.result_text,
              er.released_at,
              eo.order_date,
              pr.full_name as professional_name,
              (
                select string_agg(eoi.exam_name, ', ' order by eoi.sort_order)
                  from exam_order_items eoi
                 where eoi.exam_order_id = eo.id
              ) as exam_names
         from exam_results er
         join exam_orders eo on eo.id = er.exam_order_id
         join professionals pr on pr.id = eo.professional_id
        where eo.patient_id = $1
          and er.status = 'liberado'
        order by er.released_at desc nulls last
        limit 10`,
      [patientId],
    );

    const prescriptionRows = await tx.query<PortalPrescription>(
      `select p.id,
              p.type::text as type,
              p.status::text as status,
              p.issued_at,
              p.verification_code,
              (
                select string_agg(pi.medication_name, ', ' order by pi.sort_order)
                  from prescription_items pi
                 where pi.prescription_id = p.id
              ) as medication_names
         from prescriptions p
        where p.patient_id = $1
          and p.status = 'emitida'
        order by p.issued_at desc nulls last
        limit 10`,
      [patientId],
    );

    const documentRows = await tx.query<PortalDocument>(
      `select id, title, document_type, created_at
         from documents
        where patient_id = $1
        order by created_at desc
        limit 10`,
      [patientId],
    );

    const countRows = await tx.query<{
      completed_appointments: number;
      pending_exams: number;
      released_results: number;
    }>(
      `select
         (select count(*) from appointments where patient_id = $1 and status = 'realizada')::int as completed_appointments,
         (select count(*) from exam_orders where patient_id = $1 and status in ('solicitado', 'coletado', 'em_analise'))::int as pending_exams,
         (select count(*) from exam_results er join exam_orders eo on eo.id = er.exam_order_id where eo.patient_id = $1 and er.status = 'liberado')::int as released_results`,
      [patientId],
    );

    return {
      profile: profileRows[0] ?? null,
      nextAppointment: nextRows[0] ?? null,
      appointments: appointmentRows,
      latestResults: resultRows,
      prescriptions: prescriptionRows,
      documents: documentRows,
      completedAppointments: countRows[0]?.completed_appointments ?? 0,
      pendingExams: countRows[0]?.pending_exams ?? 0,
      releasedResults: countRows[0]?.released_results ?? 0,
    };
  });
}
