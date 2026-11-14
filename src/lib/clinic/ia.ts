import 'server-only';

import { withTenant } from '@/lib/db';

export interface AiInteractionItem {
  id: string;
  feature: string;
  prompt: string;
  response: string | null;
  status: string;
  created_at: string;
}

export async function listAiInteractions(
  userId: string,
  clinicId: string,
): Promise<AiInteractionItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<AiInteractionItem>(
      `select id, feature::text as feature, prompt, response, status::text as status, created_at::text as created_at
         from ai_interactions
        where user_id = $1
        order by created_at desc
        limit 50`,
      [userId],
    );
  });
}
