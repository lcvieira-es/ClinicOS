import Link from 'next/link';
import { Plus, Building, MapPin } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listUnits } from '@/lib/clinic/units';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';

export const metadata = { title: 'Unidades' };

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('unidades');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canCreate = access.permissions.has('unidades:create');
  const units = await listUnits(user.id, user.activeClinicId);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Cadastros"
        title="Unidades"
        description="Matriz, filiais e consultórios da clínica."
        actions={
          canCreate ? (
            <ButtonLink href="/app/unidades/nova" size="md">
              <Plus className="h-4 w-4" />
              Nova unidade
            </ButtonLink>
          ) : null
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

      {units.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building}
            title="Nenhuma unidade cadastrada"
            description="Cadastre a primeira unidade para iniciar a operação."
            action={
              canCreate ? (
                <ButtonLink href="/app/unidades/nova" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Nova unidade
                </ButtonLink>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {units.map((unit) => (
            <Link
              key={unit.id}
              href={`/app/unidades/${unit.id}`}
              className="group block"
            >
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-pop">
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-navy-800 transition group-hover:bg-mint-400/25">
                        <Building className="h-5 w-5" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-navy-900 group-hover:underline">
                          {unit.name}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-ink-400">
                          {unit.type}
                          {unit.is_headquarters ? ' · matriz' : ''}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={unit.status} />
                  </div>

                  <div className="space-y-1.5 text-[11px] text-ink-600">
                    {unit.address ? (
                      <p className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                        <span>
                          {[unit.address, unit.address_number, unit.neighborhood, unit.city, unit.state]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </p>
                    ) : (
                      <p className="text-ink-400">Sem endereço cadastrado.</p>
                    )}
                    {unit.phone ? <p>Telefone: {unit.phone}</p> : null}
                    {unit.manager_name ? (
                      <p>Responsável: {unit.manager_name}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <Badge tone="neutral">
                      {unit.professional_count} profissional(is)
                    </Badge>
                    <span className="text-[11px] font-bold text-navy-800">
                      Abrir
                    </span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
