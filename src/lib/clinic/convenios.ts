import 'server-only';

import { withTenant } from '@/lib/db';

export interface ClaimItem {
  id: string;
  patient_id: string;
  patient_name: string;
  provider_id: string;
  provider_name: string;
  guide_number: string;
  tuss_code: string | null;
  procedure_name: string | null;
  presented_amount: string;
  approved_amount: string | null;
  status: string;
  sent_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export async function listClaims(
  userId: string,
  clinicId: string,
): Promise<ClaimItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<ClaimItem>(
      `select ic.id,
              ic.patient_id,
              p.full_name as patient_name,
              ic.provider_id,
              ip.name as provider_name,
              ic.guide_number,
              ic.tuss_code,
              ic.procedure_name,
              ic.presented_amount::text as presented_amount,
              ic.approved_amount::text as approved_amount,
              ic.status::text as status,
              ic.sent_at::text as sent_at,
              ic.approved_at::text as approved_at,
              ic.paid_at::text as paid_at,
              ic.notes,
              ic.created_at::text as created_at
         from insurance_claims ic
         join patients p on p.id = ic.patient_id
         join insurance_providers ip on ip.id = ic.provider_id
        order by ic.created_at desc
        limit 200`,
    );
  });
}

export async function listInsuranceProviders(
  userId: string,
  clinicId: string,
): Promise<Array<{ id: string; name: string }>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<{ id: string; name: string }>(
      `select id, name from insurance_providers where status = 'ativo' order by name`,
    );
  });
}

export async function listAvailableInsuranceProviders(
  userId: string,
  clinicId: string,
): Promise<Array<{ id: string; name: string }>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<{ id: string; name: string }>(
      "select ip.id, ip.name from insurance_providers ip where ip.status = 'ativo' and not exists (select 1 from clinic_insurance_contracts c where c.provider_id = ip.id and c.clinic_id = $1) order by ip.name",
      [clinicId],
    );
  });
}
