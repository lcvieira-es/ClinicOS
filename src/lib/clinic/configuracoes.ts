import 'server-only';

import { withTenant } from '@/lib/db';

export interface ClinicSettings {
  id: string;
  legal_name: string;
  trade_name: string | null;
  display_name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  cep: string | null;
  address: string | null;
  address_number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
}

export async function getClinicSettings(
  userId: string,
  clinicId: string,
): Promise<ClinicSettings | null> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<ClinicSettings>(
      `select id, legal_name, trade_name, display_name, cnpj, email, phone, whatsapp,
              cep, address, address_number, complement, neighborhood, city, state, notes
         from clinics
        where id = $1`,
      [clinicId],
    );
    return rows[0] ?? null;
  });
}
