import Link from 'next/link';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { getExamOrder } from '@/lib/clinic/exames';
import { releaseExamResultAction, cancelExamOrderAction } from '@/lib/clinic/actions/exames';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Exame' };

export default async function ExameDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('exames');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const { id } = await params;
  const sp = await searchParams;
  const user = access.user;
  const canResult = access.permissions.has('exames:result');
  const canCancel = access.permissions.has('exames:delete');

  const order = await getExamOrder(user.id, user.activeClinicId, id);
  if (!order) notFound();

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Clínico · Exames"
        title={order.patient_name}
        description={
          <span className="text-[15px] text-ink-600">
            {order.priority} · {formatDateTime(order.order_date)}
          </span>
        }
        actions={
          <ButtonLink href="/app/exames" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Lista
          </ButtonLink>
        }
      />

      {sp.erro ? (
        <Alert variant="danger" className="mb-4">
          {decodeURIComponent(sp.erro)}
        </Alert>
      ) : null}
      {sp.msg ? (
        <Alert variant="success" className="mb-4">
          {decodeURIComponent(sp.msg)}
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title={<span className="text-[15px]">Itens solicitados</span>}
            description={<span className="text-[15px]">{order.items.length} exame(s)</span>}
          />
          <CardBody className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-line bg-sky-25 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] font-bold text-ink-900">{item.exam_name}</p>
                  <StatusBadge status={item.status} />
                </div>
                {item.tuss_code ? (
                  <p className="text-[15px] text-ink-400">TUSS: {item.tuss_code}</p>
                ) : null}
                {canResult && item.status !== 'resultado_disponivel' ? (
                  <form action={releaseExamResultAction} className="mt-2 space-y-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <input
                      name="resultSummary"
                      placeholder="Resumo do resultado"
                      className="h-8 w-full rounded-lg border border-[#737373] bg-white px-2 text-[15px] outline-none transition focus:border-navy-600"
                    />
                    <textarea
                      name="resultText"
                      rows={2}
                      placeholder="Resultado detalhado"
                      className="w-full rounded-lg border border-[#737373] bg-white px-2 py-1.5 text-[15px] outline-none transition focus:border-navy-600"
                    />
                    <input
                      name="referenceRange"
                      placeholder="Intervalo de referência"
                      className="h-8 w-full rounded-lg border border-[#737373] bg-white px-2 text-[15px] outline-none transition focus:border-navy-600"
                    />
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 px-2 py-1.5 text-[15px] font-semibold text-white transition hover:bg-navy-800"
                    >
                      Liberar resultado
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
            {order.items.length === 0 ? (
              <EmptyState title="Sem itens" description="Nenhum exame solicitado." className="py-6" />
            ) : null}
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title={<span className="text-[15px]">Dados da solicitação</span>} />
            <CardBody className="space-y-2 text-[15px]">
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">Paciente</span>
                <span className="font-semibold text-ink-700">{order.patient_name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">Profissional</span>
                <span className="font-semibold text-ink-700">{order.professional_name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">Prioridade</span>
                <span className="font-semibold text-ink-700 capitalize">{order.priority}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">Status</span>
                <StatusBadge status={order.status} />
              </div>
              {order.laboratory ? (
                <div className="flex justify-between gap-3">
                  <span className="text-ink-400">Laboratório</span>
                  <span className="font-semibold text-ink-700">{order.laboratory}</span>
                </div>
              ) : null}
              {order.clinical_indication ? (
                <div>
                  <span className="text-ink-400">Indicação</span>
                  <p className="font-semibold text-ink-700">{order.clinical_indication}</p>
                </div>
              ) : null}
              {order.notes ? (
                <div>
                  <span className="text-ink-400">Observações</span>
                  <p className="text-ink-700">{order.notes}</p>
                </div>
              ) : null}
            </CardBody>
          </Card>

          {canCancel ? (
            <Card>
              <CardHeader title={<span className="text-[15px]">Zona de perigo</span>} />
              <CardBody>
                <form action={cancelExamOrderAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-danger px-3 py-2 text-[15px] font-semibold text-white transition hover:bg-red-700"
                  >
                    Cancelar solicitação
                  </button>
                </form>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
