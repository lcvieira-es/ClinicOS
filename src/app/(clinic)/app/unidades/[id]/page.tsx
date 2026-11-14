import Link from 'next/link';
import { ArrowLeft, Building, MapPin, Trash2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { getUnit } from '@/lib/clinic/units';
import {
  setUnitStatusAction,
  deleteUnitAction,
} from '@/lib/clinic/actions/units';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { UnitForm } from '@/components/clinic/unit-form';

export const metadata = { title: 'Unidade' };

export default async function UnitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('unidades');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const { id } = await params;
  const sp = await searchParams;
  const user = access.user;
  const canEdit = access.permissions.has('unidades:edit');
  const canDelete = access.permissions.has('unidades:delete');

  const unit = await getUnit(user.id, user.activeClinicId, id);
  if (!unit) notFound();

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Cadastros · Unidade"
        title={unit.name}
        description={`${unit.type}${unit.is_headquarters ? ' · matriz' : ''}`}
        actions={
          <ButtonLink href="/app/unidades" variant="outline" size="sm">
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
          <CardHeader title="Dados da unidade" description="Edição inline." />
          <CardBody>
            {canEdit ? (
              <UnitForm mode="edit" unit={unit} />
            ) : (
              <p className="text-xs text-ink-500">
                Seu perfil permite apenas visualizar a unidade.
              </p>
            )}
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Situação" description="Status de operação." />
            <CardBody className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={unit.status} />
                <Badge tone="neutral">
                  {unit.professional_count} profissional(is)
                </Badge>
              </div>
              {unit.address ? (
                <p className="flex items-start gap-1.5 text-[11px] text-ink-600">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                  {[unit.address, unit.address_number, unit.neighborhood, unit.city, unit.state]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              ) : null}
              {unit.phone ? (
                <p className="text-[11px] text-ink-600">Telefone: {unit.phone}</p>
              ) : null}
              {unit.manager_name ? (
                <p className="text-[11px] text-ink-600">
                  Responsável: {unit.manager_name}
                </p>
              ) : null}
              {unit.opening_hours ? (
                <p className="text-[11px] text-ink-600">
                  Horário: {unit.opening_hours}
                </p>
              ) : null}

              {canEdit ? (
                <div className="space-y-2">
                  {unit.status === 'ativa' ? (
                    <form action={setUnitStatusAction}>
                      <input type="hidden" name="unitId" value={unit.id} />
                      <input type="hidden" name="status" value="inativa" />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-sky-25"
                      >
                        Inativar unidade
                      </button>
                    </form>
                  ) : (
                    <form action={setUnitStatusAction}>
                      <input type="hidden" name="unitId" value={unit.id} />
                      <input type="hidden" name="status" value="ativa" />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-sky-25"
                      >
                        Reativar unidade
                      </button>
                    </form>
                  )}
                </div>
              ) : null}
            </CardBody>
          </Card>

          {canDelete ? (
            <Card>
              <CardHeader
                title="Zona de perigo"
                description="Exclusão definitiva, apenas sem profissionais ou consultas."
              />
              <CardBody>
                <form action={deleteUnitAction}>
                  <input type="hidden" name="unitId" value={unit.id} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-danger px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Excluir unidade
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
