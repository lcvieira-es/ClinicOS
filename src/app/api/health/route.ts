import { NextResponse } from 'next/server';
import { trustedQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, boolean> = {};
  let schemaVersion: string | null = null;
  let tables = 0;
  let policies = 0;
  let dbOk = false;

  try {
    const ping = await trustedQuery<{ ok: number }>('select 1 as ok');
    dbOk = ping.length > 0 && ping[0].ok === 1;
    checks.database = dbOk;

    if (dbOk) {
      try {
        const v = await trustedQuery<{ version: string }>(
          `select version from schema_migrations order by version desc limit 1`,
        );
        schemaVersion = v[0]?.version ?? null;
        checks.schemaMigrations = v.length > 0;
      } catch {
        checks.schemaMigrations = false;
      }

      try {
        const t = await trustedQuery<{ n: number }>(
          `select count(*)::int as n from information_schema.tables where table_schema = 'public'`,
        );
        tables = t[0]?.n ?? 0;
        checks.tables = tables >= 50;
      } catch {
        checks.tables = false;
      }

      try {
        const p = await trustedQuery<{ n: number }>(
          `select count(*)::int as n from pg_policies where schemaname = 'public'`,
        );
        policies = p[0]?.n ?? 0;
        checks.rls = policies >= 100;
      } catch {
        checks.rls = false;
      }
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'error',
        message: error instanceof Error ? error.message : 'unknown',
        timestamp: new Date().toISOString(),
        uptimeMs: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }

  const allOk = dbOk && checks.schemaMigrations && checks.tables && checks.rls;
  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      database: dbOk ? 'ok' : 'error',
      schemaVersion,
      tables,
      policies,
      checks,
      timestamp: new Date().toISOString(),
      uptimeMs: Date.now() - startedAt,
    },
    { status: allOk ? 200 : 503 },
  );
}
