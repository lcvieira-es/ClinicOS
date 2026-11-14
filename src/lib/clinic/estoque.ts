import 'server-only';

import { withTenant } from '@/lib/db';

export interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  sku: string | null;
  quantity: string;
  minimum_quantity: string;
  unit_of_measure: string;
  unit_cost: string;
  sale_price: string | null;
  supplier: string | null;
  batch: string | null;
  expires_at: string | null;
  location: string | null;
  status: string;
  is_low: boolean;
}

export async function listInventoryItems(
  userId: string,
  clinicId: string,
): Promise<InventoryItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<InventoryItem>(
      `select id, name, category, sku, quantity::text as quantity,
              minimum_quantity::text as minimum_quantity, unit_of_measure,
              unit_cost::text as unit_cost, sale_price::text as sale_price,
              supplier, batch, expires_at::text as expires_at, location,
              status::text as status,
              (quantity < minimum_quantity) as is_low
         from inventory_items
        order by name`,
    );
  });
}

export async function listInventoryUnits(
  userId: string,
  clinicId: string,
): Promise<Array<{ id: string; name: string }>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<{ id: string; name: string }>(
      `select id, name from clinic_units where status = 'ativa' order by name`,
    );
  });
}
