import 'server-only';

import { withTenant } from '@/lib/db';

export interface MedicalRecordItem {
  id: string;
  patient_id: string;
  patient_name: string;
  professional_id: string;
  professional_name: string;
  appointment_id: string | null;
  record_date: string;
  status: string;
  version: number;
  parent_id: string | null;
  chief_complaint: string | null;
  assessment: string | null;
  verification_code: string | null;
  signed_at: string | null;
  signed_by: string | null;
  created_at: string;
}

export interface MedicalRecordDetail extends MedicalRecordItem {
  history_present_illness: string | null;
  physical_exam: string | null;
  plan: string | null;
  icd10_codes: string[] | null;
  content_hash: string | null;
  signature_hash: string | null;
  signature_method: string | null;
  notes: string | null;
  updated_at: string;
}

export interface ClinicalNoteItem {
  id: string;
  note_type: string;
  content: string;
  status: string;
  signed_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface AllergyItem {
  id: string;
  substance: string;
  reaction: string | null;
  severity: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export async function listMedicalRecords(
  userId: string,
  clinicId: string,
  patientId?: string,
): Promise<MedicalRecordItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (patientId) {
      params.push(patientId);
      conditions.push(`mr.patient_id = $${params.length}::uuid`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
    return tx.query<MedicalRecordItem>(
      `select mr.id,
              mr.patient_id,
              p.full_name as patient_name,
              mr.professional_id,
              pr.full_name as professional_name,
              mr.appointment_id,
              mr.record_date::text as record_date,
              mr.status::text as status,
              mr.version,
              mr.parent_id,
              mr.chief_complaint,
              mr.assessment,
              mr.verification_code,
              mr.signed_at::text as signed_at,
              mr.signed_by::text as signed_by,
              mr.created_at::text as created_at
         from medical_records mr
         join patients p on p.id = mr.patient_id
         join professionals pr on pr.id = mr.professional_id
         ${where}
        order by mr.record_date desc
        limit 100`,
      params,
    );
  });
}

export async function getMedicalRecord(
  userId: string,
  clinicId: string,
  recordId: string,
): Promise<MedicalRecordDetail | null> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<MedicalRecordDetail>(
      `select mr.id,
              mr.patient_id,
              p.full_name as patient_name,
              mr.professional_id,
              pr.full_name as professional_name,
              mr.appointment_id,
              mr.record_date::text as record_date,
              mr.status::text as status,
              mr.version,
              mr.parent_id,
              mr.chief_complaint,
              mr.history_present_illness,
              mr.physical_exam,
              mr.assessment,
              mr.plan,
              mr.icd10_codes,
              mr.notes,
              mr.content_hash,
              mr.signature_hash,
              mr.signature_method::text as signature_method,
              mr.verification_code,
              mr.signed_at::text as signed_at,
              mr.signed_by::text as signed_by,
              mr.created_at::text as created_at,
              mr.updated_at::text as updated_at
         from medical_records mr
         join patients p on p.id = mr.patient_id
         join professionals pr on pr.id = mr.professional_id
        where mr.id = $1`,
      [recordId],
    );
    return rows[0] ?? null;
  });
}

export async function listClinicalNotes(
  userId: string,
  clinicId: string,
  recordId: string,
): Promise<ClinicalNoteItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<ClinicalNoteItem>(
      `select id,
              note_type::text as note_type,
              content,
              status::text as status,
              signed_at::text as signed_at,
              created_at::text as created_at,
              created_by::text as created_by
         from clinical_notes
        where medical_record_id = $1
        order by created_at`,
      [recordId],
    );
  });
}

export async function listAllergies(
  userId: string,
  clinicId: string,
  patientId: string,
): Promise<AllergyItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<AllergyItem>(
      `select id,
              substance,
              reaction,
              severity::text as severity,
              notes,
              status::text as status,
              created_at::text as created_at
         from allergies
        where patient_id = $1
        order by created_at desc`,
      [patientId],
    );
  });
}

export async function logRecordAccess(
  userId: string,
  clinicId: string,
  recordId: string,
  action: string,
): Promise<void> {
  try {
    await withTenant({ userId, clinicId }, async (tx) => {
      await tx.query(
        `insert into record_access_logs (clinic_id, medical_record_id, user_id, action)
         values ($1, $2::uuid, $3::uuid, $4)`,
        [clinicId, recordId, userId, action],
      );
    });
  } catch {
    // Auditoria nunca deve bloquear a leitura.
  }
}
