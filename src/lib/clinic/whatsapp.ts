import 'server-only';

import { withTenant } from '@/lib/db';

export interface WhatsappMessageItem {
  id: string;
  patient_id: string | null;
  patient_name: string | null;
  direction: string;
  template: string | null;
  content: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export async function listWhatsappMessages(
  userId: string,
  clinicId: string,
): Promise<WhatsappMessageItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<WhatsappMessageItem>(
      `select wm.id,
              wm.patient_id,
              p.full_name as patient_name,
              wm.direction::text as direction,
              wm.template,
              wm.content,
              wm.status::text as status,
              wm.sent_at::text as sent_at,
              wm.created_at::text as created_at
         from whatsapp_messages wm
         left join patients p on p.id = wm.patient_id
        order by wm.created_at desc
        limit 100`,
    );
  });
}

export async function listWhatsappPatients(
  userId: string,
  clinicId: string,
): Promise<Array<{ id: string; name: string; phone: string | null }>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<{ id: string; name: string; phone: string | null }>(
      `select id, full_name as name, phone from patients where status <> 'arquivado' order by full_name`,
    );
  });
}
