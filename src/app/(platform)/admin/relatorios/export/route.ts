import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { getPlatformReports } from '@/lib/platform/admin-queries';
import { formatDate } from '@/lib/format';

function csvEscape(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[";\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows: Array<Array<string | number | null | undefined>>): string {
  const body = rows.map((row) => row.map(csvEscape).join(';')).join('\r\n');
  // BOM para o Excel reconhecer UTF-8.
  return `﻿${body}`;
}

export async function GET(request: NextRequest) {
  const user = await requirePlatformAdmin();
  const report = request.nextUrl.searchParams.get('report') ?? '';

  const reports = await getPlatformReports(user.id);

  let filename = 'relatorio.csv';
  let rows: Array<Array<string | number | null | undefined>> = [];

  switch (report) {
    case 'mrr-by-plan':
      filename = 'mrr-por-plano.csv';
      rows = [
        ['Plano', 'Slug', 'Assinaturas ativas', 'MRR'],
        ...reports.mrrByPlan.map((row) => [row.name, row.slug, row.subscriptions, row.mrr]),
      ];
      break;
    case 'subscriptions-by-status':
      filename = 'assinaturas-por-status.csv';
      rows = [
        ['Situação', 'Total'],
        ...reports.subscriptionsByStatus.map((row) => [row.status, row.count]),
      ];
      break;
    case 'module-adoption':
      filename = 'adocao-de-modulos.csv';
      rows = [
        ['Módulo', 'Chave', 'Ativações'],
        ...reports.moduleAdoption.map((row) => [row.name, row.key, row.adoption]),
      ];
      break;
    case 'renewals-30':
      filename = 'renovacoes-30-dias.csv';
      rows = [
        ['Clínica', 'Plano', 'Periodicidade', 'Fim do período', 'Valor'],
        ...reports.renewals30.map((row) => [
          row.clinic_name,
          row.plan_name,
          row.periodicity,
          row.current_period_end ? formatDate(row.current_period_end) : '',
          row.amount,
        ]),
      ];
      break;
    default:
      return NextResponse.json({ error: 'Relatório desconhecido.' }, { status: 400 });
  }

  return new NextResponse(toCsv(rows), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
