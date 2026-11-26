import Link from 'next/link';
import { ArrowLeft, Stethoscope, Trash2, UserX, RotateCcw } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { getProfessional } from '@/lib/clinic/professionals';
import { listUnits } from '@/lib/clinic/units';
import {
  setProfessionalStatusAction,
  deleteProfessionalAction,
} from '@/lib/clinic/actions/professionals';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { ProfessionalForm } from '@/components/clinic/professional-form';
import { formatCurrency } from '@/lib/format';

export const metadata = { title: 'Profissional' };

export default async function ProfessionalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('profissionais');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const { id } = await params;
  const sp = await searchParams;
  const user = access.user;
  const canEdit = access.permissions.has('medicos:edit');
  const canDelete = access.permissions.has('medicos:delete');

  const [professional, units] = await Promise.all([
    getProfessional(user.id, user.activeClinicId, id),
    canEdit ? listUnits(user.id, user.activeClinicId) : Promise.resolve([]),
  ]);

  if (!professional) notFound();

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Cadastros · Profissional"
        title={professional.full_name}
        description={
          professional.specialties && professional.specialties.length > 0
            ? professional.specialties.join(' · ')
            : 'Profissional do corpo clínico'
        }
        actions={
          <ButtonLink href="/app/profissionais" variant="outline" size="sm">
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
          <CardHeader title="Dados do profissional" description="Edição inline." />
          <CardBody>
            {canEdit ? (
              <ProfessionalForm
                mode="edit"
                professional={professional}
                units={units.map((unit) => ({ id: unit.id, name: unit.name }))}
                canLinkUser={access.permissions.has('usuarios:edit')}
              />
            ) : (
              <p className="text-[15px] text-ink-500">
                Seu perfil permite apenas visualizar o cadastro.
              </p>
            )}
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Situação" description="Status e vínculos." />
            <CardBody className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={professional.status} className="text-[15px]" />
                <Badge tone="neutral" className="text-[15px]">
                  {formatCurrency(professional.consultation_price)} ·{' '}
                  {professional.default_duration_min} min
                </Badge>
              </div>
              <dl className="grid gap-2 text-[15px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Conselho</dt>
                  <dd className="font-semibold text-ink-700">
                    {professional.council
                      ? `${professional.council} ${professional.council_number ?? ''}${
                          professional.council_state
                            ? `/${professional.council_state}`
                            : ''
                        }`
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Comissão</dt>
                  <dd className="font-semibold text-ink-700">
                    {professional.commission_percent}%
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Unidades</dt>
                  <dd className="font-semibold text-ink-700">
                    {professional.unit_names.length > 0
                      ? professional.unit_names.join(', ')
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">E-mail</dt>
                  <dd className="font-semibold text-ink-700">
                    {professional.email ?? '—'}
                  </dd>
                </div>
              </dl>

              {canEdit ? (
                <div className="space-y-2">
                  {professional.status === 'ativo' ? (
                    <form action={setProfessionalStatusAction}>
                      <input
                        type="hidden"
                        name="professionalId"
                        value={professional.id}
                      />
                      <input type="hidden" name="status" value="inativo" />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[15px] font-semibold text-ink-700 transition hover:bg-sky-25"
                      >
                        <UserX className="h-3.5 w-3.5" strokeWidth={2} />
                        Inativar profissional
                      </button>
                    </form>
                  ) : (
                    <form action={setProfessionalStatusAction}>
                      <input
                        type="hidden"
                        name="professionalId"
                        value={professional.id}
                      />
                      <input type="hidden" name="status" value="ativo" />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[15px] font-semibold text-ink-700 transition hover:bg-sky-25"
                      >
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                        Reativar profissional
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
                description="Exclusão definitiva, apenas sem consultas vinculadas."
              />
              <CardBody>
                <form action={deleteProfessionalAction}>
                  <input
                    type="hidden"
                    name="professionalId"
                    value={professional.id}
                  />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-danger px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Excluir profissional
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
