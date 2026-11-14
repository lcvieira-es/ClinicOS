import Link from 'next/link';
import { Plus, UserCog, Stethoscope } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listProfessionals } from '@/lib/clinic/professionals';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/format';

export const metadata = { title: 'Profissionais' };

export default async function ProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('profissionais');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canCreate = access.permissions.has('medicos:create');
  const professionals = await listProfessionals(user.id, user.activeClinicId);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Cadastros"
        title="Médicos e profissionais"
        description="Corpo clínico, conselhos, especialidades e vínculo com unidades."
        actions={
          canCreate ? (
            <ButtonLink href="/app/profissionais/novo" size="md">
              <Plus className="h-4 w-4" />
              Novo profissional
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

      {professionals.length === 0 ? (
        <Card>
          <EmptyState
            icon={Stethoscope}
            title="Nenhum profissional cadastrado"
            description="Cadastre o primeiro profissional para iniciar a agenda."
            action={
              canCreate ? (
                <ButtonLink href="/app/profissionais/novo" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Novo profissional
                </ButtonLink>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <TableShell>
          <Table>
            <thead>
              <tr>
                <Th>Profissional</Th>
                <Th className="hidden md:table-cell">Conselho</Th>
                <Th className="hidden lg:table-cell">Especialidades</Th>
                <Th className="hidden xl:table-cell">Unidades</Th>
                <Th className="hidden sm:table-cell">Valor consulta</Th>
                <Th>Status</Th>
                <Th className="text-right">Ação</Th>
              </tr>
            </thead>
            <tbody>
              {professionals.map((professional) => (
                <tr key={professional.id}>
                  <Td>
                    <Link
                      href={`/app/profissionais/${professional.id}`}
                      className="group flex items-center gap-2.5"
                    >
                      <Avatar name={professional.full_name} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-navy-900 group-hover:underline">
                          {professional.full_name}
                        </span>
                        {professional.email ? (
                          <span className="block truncate text-[10px] text-ink-400">
                            {professional.email}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <span className="text-[11px] text-ink-600">
                      {professional.council
                        ? `${professional.council} ${professional.council_number ?? ''}${professional.council_state ? `/${professional.council_state}` : ''}`
                        : '—'}
                    </span>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(professional.specialties ?? []).slice(0, 3).map((specialty) => (
                        <Badge key={specialty} tone="neutral">
                          {specialty}
                        </Badge>
                      ))}
                      {(professional.specialties ?? []).length > 3 ? (
                        <Badge tone="neutral">
                          +{(professional.specialties ?? []).length - 3}
                        </Badge>
                      ) : null}
                    </div>
                  </Td>
                  <Td className="hidden xl:table-cell">
                    <span className="text-[11px] text-ink-600">
                      {professional.unit_names.length > 0
                        ? professional.unit_names.join(', ')
                        : '—'}
                    </span>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <span className="text-xs font-semibold text-navy-900">
                      {formatCurrency(professional.consultation_price)}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={professional.status} />
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/app/profissionais/${professional.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-800 transition hover:text-navy-950"
                    >
                      Abrir
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableShell>
      )}
    </div>
  );
}
