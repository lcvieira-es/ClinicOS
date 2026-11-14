import Link from 'next/link';
import { Plus, ShieldCheck } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listClaims, listInsuranceProviders, listAvailableInsuranceProviders } from '@/lib/clinic/convenios';
import { listPatientOptions } from '@/lib/clinic/patients';
import { createClaimAction, setClaimStatusAction, createInsuranceContractAction } from '@/lib/clinic/actions/convenios';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/input';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { Alert } from '@/components/ui/alert';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata = { title: 'Convênios' };

export default async function ConveniosPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('convenios');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canCreate = access.permissions.has('convenios:create');
  const canEdit = access.permissions.has('convenios:edit');

  const [claims, providers, patients] = await Promise.all([
    listClaims(user.id, user.activeClinicId),
    listInsuranceProviders(user.id, user.activeClinicId),
    listPatientOptions(user.id, user.activeClinicId),
  ]);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Gestão"
        title="Convênios"
        description="Guias, autorizações e faturamento."
        actions={
          canCreate ? (
            <ButtonLink href="/app/convenios/novo" size="md">
              <Plus className="h-4 w-4" />
              Nova guia
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

      <Card>
        <CardHeader title="Guias" description={`${claims.length} registro(s)`} />
        <CardBody className="p-0">
          {claims.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Nenhuma guia cadastrada"
              description="Crie uma nova guia de convênio."
              className="py-8"
            />
          ) : (
            <TableShell>
              <Table>
                <thead>
                  <tr>
                    <Th>Guia</Th>
                    <Th>Paciente</Th>
                    <Th className="hidden md:table-cell">Operadora</Th>
                    <Th className="hidden lg:table-cell">Apresentado</Th>
                    <Th className="hidden lg:table-cell">Aprovado</Th>
                    <Th>Status</Th>
                    {canEdit ? <Th className="text-right">Ações</Th> : null}
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id}>
                      <Td>
                        <p className="text-xs font-bold text-ink-900">{claim.guide_number}</p>
                        {claim.procedure_name ? (
                          <p className="text-[10px] text-ink-400">{claim.procedure_name}</p>
                        ) : null}
                      </Td>
                      <Td>{claim.patient_name}</Td>
                      <Td className="hidden md:table-cell">{claim.provider_name}</Td>
                      <Td className="hidden lg:table-cell">{formatCurrency(claim.presented_amount)}</Td>
                      <Td className="hidden lg:table-cell">
                        {claim.approved_amount ? formatCurrency(claim.approved_amount) : '”'}
                      </Td>
                      <Td>
                        <StatusBadge status={claim.status} />
                      </Td>
                      {canEdit ? (
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {claim.status === 'rascunho' ? (
                              <form action={setClaimStatusAction}>
                                <input type="hidden" name="claimId" value={claim.id} />
                                <input type="hidden" name="status" value="enviada" />
                                <button type="submit" className="rounded-lg bg-navy-900 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-navy-800">
                                  Enviar
                                </button>
                              </form>
                            ) : null}
                            {claim.status === 'enviada' ? (
                              <form action={setClaimStatusAction} className="flex items-center gap-1">
                                <input type="hidden" name="claimId" value={claim.id} />
                                <input type="hidden" name="status" value="aprovada" />
                                <input
                                  name="approvedAmount"
                                  placeholder="Aprovado"
                                  className="h-7 w-20 rounded-lg border border-[#737373] bg-white px-2 text-[10px] outline-none transition focus:border-navy-600"
                                />
                                <button type="submit" className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-emerald-700">
                                  Aprovar
                                </button>
                              </form>
                            ) : null}
                            {(claim.status === 'aprovada' || claim.status === 'glosada') ? (
                              <form action={setClaimStatusAction}>
                                <input type="hidden" name="claimId" value={claim.id} />
                                <input type="hidden" name="status" value="paga" />
                                <button type="submit" className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-emerald-700">
                                  Pagar
                                </button>
                              </form>
                            ) : null}
                            {claim.status === 'enviada' ? (
                              <form action={setClaimStatusAction}>
                                <input type="hidden" name="claimId" value={claim.id} />
                                <input type="hidden" name="status" value="glosada" />
                                <button type="submit" className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-danger-soft">
                                  Glosar
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </Td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableShell>
          )}
        </CardBody>
      </Card>

    </div>
  );
}
