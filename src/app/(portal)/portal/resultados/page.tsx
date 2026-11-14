import { FlaskConical, ShieldCheck } from 'lucide-react';
import { requirePortalUser } from '@/lib/auth/guards';
import { getPortalOverview } from '@/lib/portal/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { formatDate, formatDateTime } from '@/lib/format';

export default async function PortalResultsPage() {
  const user = await requirePortalUser();
  const access =
    user.portalAccess.find((item) => item.clinicId === user.activeClinicId) ??
    user.portalAccess[0];

  const data = await getPortalOverview(user.id, access.clinicId, access.patientId);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow={access.clinicName}
        title="Resultados de exames"
        description="Somente resultados liberados pelo profissional responsável."
        actions={<Badge tone="mint">{data.releasedResults} liberados</Badge>}
      />

      {data.pendingExams > 0 ? (
        <Alert variant="warning" title="Exames em andamento" className="mb-5">
          Você possui {data.pendingExams} exame(s) aguardando coleta, análise ou
          liberação. O resultado aparecerá aqui assim que for liberado.
        </Alert>
      ) : null}

      {data.latestResults.length === 0 ? (
        <Card>
          <EmptyState
            icon={FlaskConical}
            title="Nenhum resultado liberado"
            description="A clínica ainda não liberou resultados de exames para o seu cadastro. Em caso de dúvida, entre em contato com a recepção."
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.latestResults.map((result) => (
            <Card key={result.id}>
              <CardHeader
                title={result.exam_names ?? 'Exame'}
                description={`Solicitado em ${formatDate(result.order_date)} · ${result.professional_name}`}
                action={
                  <Badge tone="success" dot>
                    Liberado
                  </Badge>
                }
              />
              <CardBody className="space-y-3">
                {result.result_summary ? (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                      Resumo
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-700">
                      {result.result_summary}
                    </p>
                  </div>
                ) : null}

                {result.result_text ? (
                  <details className="rounded-xl border border-line bg-sky-25 px-3 py-2.5">
                    <summary className="cursor-pointer text-[11px] font-bold text-navy-900">
                      Ver laudo completo
                    </summary>
                    <p className="mt-2 whitespace-pre-line text-[11px] leading-relaxed text-ink-600">
                      {result.result_text}
                    </p>
                  </details>
                ) : null}

                <div className="flex items-center justify-between border-t border-line pt-2.5 text-[10px] text-ink-400">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    Resultado liberado pelo profissional
                  </span>
                  <span>{formatDateTime(result.released_at)}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-5 text-[10px] leading-relaxed text-ink-400">
        Os resultados são documentos de apoio e não substituem a consulta médica. Em
        caso de dúvidas ou sintomas, procure a clínica.
      </p>
    </div>
  );
}
