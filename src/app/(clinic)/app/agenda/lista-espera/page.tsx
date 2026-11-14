import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listWaitingList } from '@/lib/clinic/agenda';
import { listPatientOptions } from '@/lib/clinic/patients';
import { listProfessionals } from '@/lib/clinic/professionals';
import { listUnits } from '@/lib/clinic/units';
import {
  updateWaitingListStatusAction,
  deleteWaitingListItemAction,
} from '@/lib/clinic/actions/agenda';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { WaitingListForm } from '@/components/clinic/waiting-list-form';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Lista de espera' };

export default async function WaitingListPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('agenda');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canCreate = access.permissions.has('agenda:create');
  const canEdit = access.permissions.has('agenda:edit');
  const canDelete = access.permissions.has('agenda:delete');

  const [items, patients, professionals, units] = await Promise.all([
    listWaitingList(user.id, user.activeClinicId),
    listPatientOptions(user.id, user.activeClinicId),
    listProfessionals(user.id, user.activeClinicId),
    listUnits(user.id, user.activeClinicId),
  ]);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Operação"
        title="Lista de espera"
        description="Pacientes aguardando encaixe na agenda."
        actions={
          <ButtonLink href="/app/agenda" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
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

      {canCreate ? (
        <Card className="mb-5">
          <CardHeader title="Adicionar à lista" />
          <CardBody>
            <WaitingListForm
              patients={patients}
              professionals={professionals.map((p) => ({
                id: p.id,
                name: p.full_name,
              }))}
              units={units.map((u) => ({ id: u.id, name: u.name }))}
            />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Pacientes na lista" description={`${items.length} registro(s)`} />
        <CardBody className="p-0">
          {items.length === 0 ? (
            <EmptyState
              title="Lista de espera vazia"
              description="Adicione pacientes que aguardam encaixe."
              className="py-8"
            />
          ) : (
            <div className="divide-y divide-line">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy-900">
                      {item.patient_name}
                    </p>
                    <p className="text-[10px] text-ink-400">
                      {item.unit_name} · {item.professional_name ?? 'Qualquer profissional'} · prioridade {item.priority}
                    </p>
                    {item.desired_from ? (
                      <p className="text-[10px] text-ink-400">
                        Desejado: {formatDateTime(item.desired_from)}
                        {item.desired_to ? ` até ${formatDateTime(item.desired_to)}` : ''}
                      </p>
                    ) : null}
                    {item.notes ? (
                      <p className="text-[10px] text-ink-400">{item.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    {canEdit ? (
                      <form action={updateWaitingListStatusAction}>
                        <input type="hidden" name="waitingId" value={item.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={item.status === 'aguardando' ? 'contatado' : 'agendado'}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-line px-2 py-1 text-[10px] font-semibold text-ink-700 transition hover:bg-sky-25"
                        >
                          {item.status === 'aguardando' ? 'Marcar contatado' : 'Marcar agendado'}
                        </button>
                      </form>
                    ) : null}
                    {canDelete ? (
                      <form action={deleteWaitingListItemAction}>
                        <input type="hidden" name="waitingId" value={item.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-danger-soft"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
