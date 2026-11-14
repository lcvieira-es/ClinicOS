import Link from 'next/link';
import { ShieldCheck, CircleCheck, CircleX } from 'lucide-react';
import { withTenant } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';

export const metadata = { title: 'Verificação de documento' };

export default async function VerificarPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  let result: {
    found: boolean;
    type?: string;
    status?: string;
    signedAt?: string | null;
    professional?: string | null;
    version?: number;
    valid?: boolean;
  } = { found: false };

  try {
    const rows = await withTenant({ userId: '', clinicId: '' }, async (tx) => {
      return tx.query<{ result: unknown }>(
        `select app_verify_document($1) as result`,
        [codigo],
      );
    });
    const raw = rows[0]?.result as typeof result | null;
    if (raw) result = raw;
  } catch {
    result = { found: false };
  }

  const typeLabel =
    result.type === 'prontuario'
      ? 'Prontuário'
      : result.type === 'prescricao'
        ? 'Prescrição'
        : 'Documento';

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-25 px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <PageHeader
          eyebrow="ClinicOS · Verificação pública"
          title="Autenticidade do documento"
          description="Confirmação de que o documento foi assinado internamente."
        />

        <Card>
          <CardBody className="space-y-4">
            {!result.found ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CircleX className="h-10 w-10 text-red-500" />
                <p className="text-sm font-bold text-navy-900">
                  Documento não encontrado
                </p>
                <p className="text-xs text-ink-500">
                  O código informado não corresponde a nenhum documento assinado.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {result.valid ? (
                    <CircleCheck className="h-8 w-8 text-emerald-600" />
                  ) : (
                    <CircleX className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-navy-900">
                      {result.valid ? 'Documento válido' : 'Documento inválido'}
                    </p>
                    <p className="text-[11px] text-ink-500">
                      {typeLabel} · versão {result.version ?? 1}
                    </p>
                  </div>
                </div>

                <dl className="grid gap-2 text-[11px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-400">Tipo</dt>
                    <dd className="font-semibold text-ink-700">{typeLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-400">Status</dt>
                    <dd className="font-semibold text-ink-700">
                      {result.status ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-400">Profissional</dt>
                    <dd className="font-semibold text-ink-700">
                      {result.professional ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-400">Assinado em</dt>
                    <dd className="font-semibold text-ink-700">
                      {result.signedAt
                        ? new Date(result.signedAt).toLocaleString('pt-BR', {
                            timeZone: 'America/Sao_Paulo',
                          })
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-400">Código</dt>
                    <dd className="font-mono text-[10px] text-ink-700">
                      {codigo}
                    </dd>
                  </div>
                </dl>

                <p className="text-[10px] leading-relaxed text-ink-400">
                  Esta verificação confirma a autenticidade da assinatura interna
                  e não expõe dados clínicos do paciente.
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <p className="text-center text-[11px] text-ink-400">
          <Link href="/login" className="font-semibold text-navy-800 hover:underline">
            Acessar o ClinicOS
          </Link>
        </p>
      </div>
    </main>
  );
}
