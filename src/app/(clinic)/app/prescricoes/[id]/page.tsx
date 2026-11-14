import Link from 'next/link';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { getPrescription } from '@/lib/clinic/prescricoes';
import {
  signPrescriptionAction,
  cancelPrescriptionAction,
} from '@/lib/clinic/actions/prescricoes';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Prescrição' };

export default async function PrescricaoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('prescricoes');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const { id } = await params;
  const sp = await searchParams;
  const user = access.user;
  const canSign = access.permissions.has('prescricoes:sign');
  const canCancel = access.permissions.has('prescricoes:cancel');

  const prescription = await getPrescription(user.id, user.activeClinicId, id);
  if (!prescription) notFound();

  const isDraft = prescription.status === 'rascunho';

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Clínico · Prescrição"
        title={prescription.patient_name}
        description={`${prescription.type} · ${formatDateTime(prescription.created_at)}`}
        actions={
          <ButtonLink href="/app/prescricoes" variant="outline" size="sm">
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
          <CardHeader title="Itens da receita" description={`${prescription.items.length} medicamento(s)`} />
          <CardBody className="p-0">
            <div className="divide-y divide-line">
              {prescription.items.map((item) => (
                <div key={item.id} className="px-5 py-3">
                  <p className="text-xs font-bold text-ink-900">{item.medication_name}</p>
                  <p className="text-[10px] text-ink-500">
                    {[item.dose, item.frequency, item.duration, item.route, item.quantity ? `Qtd: ${item.quantity}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {item.instructions ? (
                    <p className="text-[10px] text-ink-400">{item.instructions}</p>
                  ) : null}
                </div>
              ))}
            </div>
            {prescription.notes ? (
              <div className="border-t border-line px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                  Observações
                </p>
                <p className="text-xs text-ink-700">{prescription.notes}</p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Status" description="Assinatura e verificação." />
            <CardBody className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={prescription.status} />
                {prescription.verification_code ? (
                  <Badge tone="mint" dot>
                    {prescription.verification_code}
                  </Badge>
                ) : null}
              </div>
              {prescription.signed_at ? (
                <p className="text-[11px] text-ink-600">
                  Assinada em {formatDateTime(prescription.signed_at)}.
                </p>
              ) : null}
              {prescription.content_hash ? (
                <p className="font-mono text-[9px] leading-relaxed text-ink-400 break-all">
                  Hash: {prescription.content_hash}
                </p>
              ) : null}

              {canSign && isDraft ? (
                <form action={signPrescriptionAction}>
                  <input type="hidden" name="prescriptionId" value={prescription.id} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
                  >
                    <LockKeyhole className="h-3.5 w-3.5" strokeWidth={2} />
                    Assinar e emitir
                  </button>
                </form>
              ) : null}

              {canCancel && isDraft ? (
                <form action={cancelPrescriptionAction}>
                  <input type="hidden" name="prescriptionId" value={prescription.id} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-danger-soft/40 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-danger-soft"
                  >
                    Cancelar prescrição
                  </button>
                </form>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
