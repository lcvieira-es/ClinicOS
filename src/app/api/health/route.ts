import { NextResponse } from 'next/server';
import { trustedQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  try {
    const rows = await trustedQuery<{ ok: number }>('select 1 as ok');
    const dbOk = rows.length > 0 && rows[0].ok === 1;
    return NextResponse.json(
      {
        status: dbOk ? 'ok' : 'degraded',
        database: dbOk ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        uptimeMs: Date.now() - startedAt,
      },
      { status: dbOk ? 200 : 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'error',
        message: error instanceof Error ? error.message : 'unknown',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
