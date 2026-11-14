import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listBlocks } from '@/lib/clinic/agenda';
import { listProfessionals } from '@/lib/clinic/professionals';
import { listUnits } from '@/lib/clinic/units';
import { deleteBlockAction } from '@/lib/clinic/actions/agenda';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { BlockForm } from '@/components/clinic/block-form';
import { formatDateTime, formatTime } from '@/lib/format';

export const metadata = { title: 'Bloqueios de agenda' };

export default async function BlocksPage({
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
  const canEdit = access.permissions.has('agenda:edit');

  const [blocks, professionals, units] = await Promise.all([
    listBlocks(user.id, user.activeClinicId),
    listProfessionals(user.id, user.activeClinicId),
    listUnits(user.id, user.activeClinicId),
  ]);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Operação"
        title="Bloqueios de agenda"
        description="Períodos em que o profissional não atende."
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

      {canEdit ? (
        <Card className="mb-5">
          <CardHeader title="Novo bloqueio" description="Bloqueia o horário para o profissional." />
          <CardBody>
            <BlockForm
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
        <CardHeader title="Bloqueios cadastrados" />
        <CardBody className="p-0">
          {blocks.length === 0 ? (
            <EmptyState
              title="Nenhum bloqueio cadastrado"
              description="Crie um bloqueio para reservar horários do profissional."
              className="py-8"
            />
          ) : (
            <div className="divide-y divide-line">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy-900">
                      {block.professional_name}
                    </p>
                    <p className="text-[10px] text-ink-400">
                      {formatDateTime(block.starts_at)} → {formatTime(block.ends_at)}
                      {block.unit_name ? ` · ${block.unit_name}` : ''}
                      {block.reason ? ` · ${block.reason}` : ''}
                    </p>
                  </div>
                  {canEdit ? (
                    <form action={deleteBlockAction}>
                      <input type="hidden" name="blockId" value={block.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-danger-soft"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remover
                      </button>
                    </form>
                  ) : (
                    <Badge tone="warning">Bloqueio</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
