import { NextResponse } from 'next/server';
import { trustedQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  try {
    const clinics = await trustedQuery<{ id: string; display_name: string }>(
      `select id::text, display_name from clinics where status = 'ativa' order by display_name`,
    );

    const results: Array<{
      clinicId: string;
      clinicName: string;
      checked: number;
      chainValid: boolean;
      brokenAt: number | null;
    }> = [];

    let broken = 0;
    for (const clinic of clinics) {
      try {
        const rows = await trustedQuery<{
          checked: string;
          chain_valid: boolean;
          broken_at: string | null;
        }>(`select checked, chain_valid, broken_at from fn_verify_audit_chain($1::uuid)`, [
          clinic.id,
        ]);
        const r = rows[0];
        const entry = {
          clinicId: clinic.id,
          clinicName: clinic.display_name,
          checked: Number(r?.checked ?? 0),
          chainValid: Boolean(r?.chain_valid),
          brokenAt: r?.broken_at ? Number(r.broken_at) : null,
        };
        results.push(entry);
        if (!entry.chainValid) {
          broken++;
          console.warn(
            `[audit-check] CADEIA QUEBRADA: clínica ${clinic.display_name} (${clinic.id}) — broken_at=${entry.brokenAt}, checked=${entry.checked}`,
          );
        }
      } catch (err) {
        console.error(`[audit-check] erro na clínica ${clinic.id}:`, err);
        results.push({
          clinicId: clinic.id,
          clinicName: clinic.display_name,
          checked: 0,
          chainValid: false,
          brokenAt: null,
        });
        broken++;
      }
    }

    const ok = broken === 0;
    return NextResponse.json(
      {
        status: ok ? 'ok' : 'broken',
        clinicsChecked: clinics.length,
        broken,
        results,
        timestamp: new Date().toISOString(),
      },
      { status: ok ? 200 : 500 },
    );
  } catch (error) {
    console.error('[audit-check] falha geral:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'unknown',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
