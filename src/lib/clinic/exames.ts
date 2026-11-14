import 'server-only';

import { withTenant } from '@/lib/db';

export interface ExamCatalogItem {
  id: string;
  name: string;
  tuss_code: string | null;
  exam_type: string | null;
  reference_price: string | null;
}

export interface ExamOrderItem {
  id: string;
  exam_catalog_id: string | null;
  exam_name: string;
  tuss_code: string | null;
  status: string;
}

export interface ExamOrderDetail {
  id: string;
  patient_id: string;
  patient_name: string;
  professional_id: string;
  professional_name: string;
  appointment_id: string | null;
  order_date: string;
  priority: string;
  status: string;
  laboratory: string | null;
  clinical_indication: string | null;
  notes: string | null;
  verification_code: string | null;
  created_at: string;
  items: ExamOrderItem[];
}

export async function listExamOrders(
  userId: string,
  clinicId: string,
  patientId?: string,
): Promise<ExamOrderDetail[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (patientId) {
      params.push(patientId);
      conditions.push(`eo.patient_id = $${params.length}::uuid`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
    const rows = await tx.query<Omit<ExamOrderDetail, 'items'>>(
      `select eo.id,
              eo.patient_id,
              p.full_name as patient_name,
              eo.professional_id,
              pr.full_name as professional_name,
              eo.appointment_id,
              eo.order_date::text as order_date,
              eo.priority::text as priority,
              eo.status::text as status,
              eo.laboratory,
              eo.clinical_indication,
              eo.notes,
              eo.verification_code,
              eo.created_at::text as created_at
         from exam_orders eo
         join patients p on p.id = eo.patient_id
         join professionals pr on pr.id = eo.professional_id
         ${where}
        order by eo.order_date desc
        limit 100`,
      params,
    );

    const result: ExamOrderDetail[] = [];
    for (const row of rows) {
      const items = await tx.query<ExamOrderItem>(
        `select id, exam_catalog_id::text as exam_catalog_id, exam_name, tuss_code, status::text as status
           from exam_order_items
          where exam_order_id = $1
          order by sort_order, created_at`,
        [row.id],
      );
      result.push({ ...row, items });
    }
    return result;
  });
}

export async function getExamOrder(
  userId: string,
  clinicId: string,
  orderId: string,
): Promise<ExamOrderDetail | null> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<Omit<ExamOrderDetail, 'items'>>(
      `select eo.id,
              eo.patient_id,
              p.full_name as patient_name,
              eo.professional_id,
              pr.full_name as professional_name,
              eo.appointment_id,
              eo.order_date::text as order_date,
              eo.priority::text as priority,
              eo.status::text as status,
              eo.laboratory,
              eo.clinical_indication,
              eo.notes,
              eo.verification_code,
              eo.created_at::text as created_at
         from exam_orders eo
         join patients p on p.id = eo.patient_id
         join professionals pr on pr.id = eo.professional_id
        where eo.id = $1`,
      [orderId],
    );
    if (rows.length === 0) return null;
    const items = await tx.query<ExamOrderItem>(
      `select id, exam_catalog_id::text as exam_catalog_id, exam_name, tuss_code, status::text as status
         from exam_order_items
        where exam_order_id = $1
        order by sort_order, created_at`,
      [orderId],
    );
    return { ...rows[0], items };
  });
}

export async function listExamCatalog(
  userId: string,
  clinicId: string,
): Promise<ExamCatalogItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<ExamCatalogItem>(
      `select id, name, tuss_code, exam_type, reference_price::text as reference_price
         from exam_catalog
        where is_active = true
          and (clinic_id is null or clinic_id = $1)
        order by name`,
      [clinicId],
    );
  });
}
