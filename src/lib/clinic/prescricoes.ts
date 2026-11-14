import 'server-only';

import { withTenant } from '@/lib/db';

export interface MedicationItem {
  id: string;
  name: string;
  active_ingredient: string | null;
  presentation: string | null;
  controlled_class: string | null;
  default_dosage: string | null;
  is_global: boolean;
}

export interface PrescriptionItem {
  id: string;
  medication_id: string | null;
  medication_name: string;
  dose: string | null;
  frequency: string | null;
  duration: string | null;
  route: string | null;
  quantity: string | null;
  instructions: string | null;
  sort_order: number;
}

export interface PrescriptionDetail {
  id: string;
  patient_id: string;
  patient_name: string;
  professional_id: string;
  professional_name: string;
  appointment_id: string | null;
  type: string;
  status: string;
  issued_at: string | null;
  verification_code: string | null;
  notes: string | null;
  content_hash: string | null;
  signature_hash: string | null;
  signed_at: string | null;
  signed_by: string | null;
  created_at: string;
  items: PrescriptionItem[];
}

export async function listPrescriptions(
  userId: string,
  clinicId: string,
  patientId?: string,
): Promise<PrescriptionDetail[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (patientId) {
      params.push(patientId);
      conditions.push(`pr.patient_id = $${params.length}::uuid`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
    const rows = await tx.query<Omit<PrescriptionDetail, 'items'>>(
      `select pr.id,
              pr.patient_id,
              p.full_name as patient_name,
              pr.professional_id,
              prof.full_name as professional_name,
              pr.appointment_id,
              pr.type::text as type,
              pr.status::text as status,
              pr.issued_at::text as issued_at,
              pr.verification_code,
              pr.notes,
              pr.content_hash,
              pr.signature_hash,
              pr.signed_at::text as signed_at,
              pr.signed_by::text as signed_by,
              pr.created_at::text as created_at
         from prescriptions pr
         join patients p on p.id = pr.patient_id
         join professionals prof on prof.id = pr.professional_id
         ${where}
        order by pr.created_at desc
        limit 100`,
      params,
    );

    const result: PrescriptionDetail[] = [];
    for (const row of rows) {
      const items = await tx.query<PrescriptionItem>(
        `select id, medication_id::text as medication_id, medication_name, dose, frequency, duration, route, quantity::text as quantity, instructions, sort_order
           from prescription_items
          where prescription_id = $1
          order by sort_order, created_at`,
        [row.id],
      );
      result.push({ ...row, items });
    }
    return result;
  });
}

export async function getPrescription(
  userId: string,
  clinicId: string,
  prescriptionId: string,
): Promise<PrescriptionDetail | null> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<Omit<PrescriptionDetail, 'items'>>(
      `select pr.id,
              pr.patient_id,
              p.full_name as patient_name,
              pr.professional_id,
              prof.full_name as professional_name,
              pr.appointment_id,
              pr.type::text as type,
              pr.status::text as status,
              pr.issued_at::text as issued_at,
              pr.verification_code,
              pr.notes,
              pr.content_hash,
              pr.signature_hash,
              pr.signed_at::text as signed_at,
              pr.signed_by::text as signed_by,
              pr.created_at::text as created_at
         from prescriptions pr
         join patients p on p.id = pr.patient_id
         join professionals prof on prof.id = pr.professional_id
        where pr.id = $1`,
      [prescriptionId],
    );
    if (rows.length === 0) return null;
    const items = await tx.query<PrescriptionItem>(
      `select id, medication_id::text as medication_id, medication_name, dose, frequency, duration, route, quantity::text as quantity, instructions, sort_order
         from prescription_items
        where prescription_id = $1
        order by sort_order, created_at`,
      [prescriptionId],
    );
    return { ...rows[0], items };
  });
}

export async function listMedications(
  userId: string,
  clinicId: string,
): Promise<MedicationItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<MedicationItem>(
      `select id,
              name,
              active_ingredient,
              presentation,
              controlled_class,
              default_dosage,
              (clinic_id is null) as is_global
         from medications
        where is_active = true
          and (clinic_id is null or clinic_id = $1)
        order by name`,
      [clinicId],
    );
  });
}

export async function listPatientOptionsForPresc(
  userId: string,
  clinicId: string,
): Promise<Array<{ id: string; name: string }>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<{ id: string; name: string }>(
      `select id, full_name as name from patients where status <> 'arquivado' order by full_name`,
    );
  });
}
