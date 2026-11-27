import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listMembers, listInvites, listUnitOptionsForTeam } from '@/lib/clinic/team';
import {
  revokeInviteAction,
  updateMemberRoleAction,
  updateMemberUnitsAction,
  setMemberStatusAction,
  removeMemberAction,
} from '@/lib/clinic/actions/team';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { Alert } from '@/components/ui/alert';
import { InviteForm } from '@/components/clinic/invite-form';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Usuários e permissões' };

const ROLE_LABELS: Record<string, string> = {
  clinic_admin: 'Administrador',
  doctor: 'Médico',
  receptionist: 'Recepcionista',
  finance: 'Financeiro',
};

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('usuarios');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canInvite = access.permissions.has('usuarios:invite');
  const canEdit = access.permissions.has('usuarios:edit');
  const canDelete = access.permissions.has('usuarios:delete');

  const [members, invites, units] = await Promise.all([
    listMembers(user.id, user.activeClinicId),
    listInvites(user.id, user.activeClinicId),
    listUnitOptionsForTeam(user.id, user.activeClinicId),
  ]);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Sistema"
        title="Usuários e permissões"
        description="Equipe, convites e vínculo com unidades."
        actions={
          <ButtonLink href="/app/painel" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Painel
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

      {canInvite ? (
        <Card className="mb-5">
          <CardHeader
            title="Convidar novo usuário"
            description="Gera um link de aceite válido por 7 dias."
          />
          <CardBody>
            <InviteForm units={units} />
          </CardBody>
        </Card>
      ) : null}

      <Card className="mb-5">
        <CardHeader
          title="Membros da clínica"
          description={`${members.length} usuário(s)`}
        />
        <CardBody className="p-0">
          {members.length === 0 ? (
            <EmptyState
              title="Nenhum membro cadastrado"
              description="Convide o primeiro usuário da equipe."
              className="py-8"
            />
          ) : (
            <TableShell>
              <Table>
                <thead>
                  <tr>
                    <Th className="text-left text-[16px]">Usuário</Th>
                    <Th className="hidden md:table-cell text-[16px]">Perfil</Th>
                    <Th className="hidden lg:table-cell text-[16px]">Unidades</Th>
                    <Th className="hidden xl:table-cell text-[16px]">Status</Th>
                    <Th className="text-right text-[16px]">Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.membership_id}>s
                      <Td>
                        <p className="text-xs font-bold text-ink-900">
                          {member.full_name}
                        </p>
                        <p className="text-[10px] text-ink-400">{member.email}</p>
                      </Td>
                      <Td className="hidden md:table-cell">
                        {canEdit ? (
                          <form
                            action={updateMemberRoleAction}
                            className="flex items-center gap-1"
                          >
                            <input
                              type="hidden"
                              name="membershipId"
                              value={member.membership_id}
                            />
                            <select
                              name="role"
                              defaultValue={member.role}
                              className="h-8 rounded-lg border border-[#737373] bg-white px-2 text-[11px] outline-none transition focus:border-navy-600"
                            >
                              <option value="clinic_admin">Administrador</option>
                              <option value="doctor">Médico</option>
                              <option value="receptionist">Recepcionista</option>
                              <option value="finance">Financeiro</option>
                            </select>
                            <button
                              type="submit"
                              className="rounded-lg bg-navy-900 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-navy-800"
                            >
                              Salvar
                            </button>
                          </form>
                        ) : (
                          <Badge tone="neutral">
                            {ROLE_LABELS[member.role] ?? member.role}
                          </Badge>
                        )}
                      </Td>
                      <Td className="hidden lg:table-cell">
                        {canEdit ? (
                          <form
                            action={updateMemberUnitsAction}
                            className="space-y-1"
                          >
                            <input
                              type="hidden"
                              name="membershipId"
                              value={member.membership_id}
                            />
                            <div className="flex flex-wrap gap-1">
                              {units.map((unit) => (
                                <label
                                  key={unit.id}
                                  className="inline-flex items-center gap-1 rounded-lg border border-line bg-sky-25 px-2 py-0.5 text-[10px] text-ink-700"
                                >
                                  <input
                                    type="checkbox"
                                    name="unitIds"
                                    value={unit.id}
                                    defaultChecked={member.units.some(
                                      (item) => item.id === unit.id,
                                    )}
                                    className="h-3 w-3 accent-navy-900"
                                  />
                                  {unit.name}
                                </label>
                              ))}
                            </div>
                            <button
                              type="submit"
                              className="rounded-lg border border-line px-2 py-0.5 text-[10px] font-semibold text-ink-700 transition hover:bg-sky-100"
                            >
                              Atualizar unidades
                            </button>
                          </form>
                        ) : (
                          <span className="text-[11px] text-ink-600">
                            {member.units.length > 0
                              ? member.units.map((u) => u.name).join(', ')
                              : '”'}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <StatusBadge status={member.status} />
                      </Td>
                      {canEdit ? (
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {member.status === 'ativo' ? (
                              <form action={setMemberStatusAction}>
                                <input
                                  type="hidden"
                                  name="membershipId"
                                  value={member.membership_id}
                                />
                                <input type="hidden" name="status" value="suspenso" />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-amber-200 px-2 py-1 text-[10px] font-semibold text-amber-700 transition hover:bg-warning-soft"
                                >
                                  Suspender
                                </button>
                              </form>
                            ) : member.status === 'suspenso' ? (
                              <form action={setMemberStatusAction}>
                                <input
                                  type="hidden"
                                  name="membershipId"
                                  value={member.membership_id}
                                />
                                <input type="hidden" name="status" value="ativo" />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-success-soft"
                                >
                                  Reativar
                                </button>
                              </form>
                            ) : null}
                            {canDelete && member.user_id !== user.id ? (
                              <form action={removeMemberAction}>
                                <input
                                  type="hidden"
                                  name="membershipId"
                                  value={member.membership_id}
                                />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-danger-soft"
                                >
                                  <Trash2 className="h-3 w-3" />
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

      <Card>
        <CardHeader
          title="Convites"
          description={`${invites.length} convite(s)`}
        />
        <CardBody className="p-0">
          {invites.length === 0 ? (
            <EmptyState
              title="Nenhum convite enviado"
              description="Crie um convite para adicionar pessoas à equipe."
              className="py-8"
            />
          ) : (
            <TableShell>
              <Table>
                <thead>
                  <tr>
                    <Th>E-mail</Th>
                    <Th className="hidden sm:table-cell">Nome</Th>
                    <Th>Perfil</Th>
                    <Th>Status</Th>
                    <Th className="hidden md:table-cell">Expira em</Th>
                    {canEdit ? <Th className="text-right">Ações</Th> : null}
                  </tr>
                </thead>
                <tbody>
                  {invites.map((invite) => (
                    <tr key={invite.id}>
                      <Td>
                        <p className="text-xs font-bold text-ink-900">
                          {invite.email}
                        </p>
                      </Td>
                      <Td className="hidden sm:table-cell">
                        <span className="text-[11px] text-ink-600">
                          {invite.full_name ?? '”'}
                        </span>
                      </Td>
                      <Td>
                        <Badge tone="neutral">
                          {ROLE_LABELS[invite.role] ?? invite.role}
                        </Badge>
                      </Td>
                      <Td>
                        <StatusBadge status={invite.status} />
                      </Td>
                      <Td className="hidden md:table-cell">
                        <span className="text-[11px] text-ink-600">
                          {formatDateTime(invite.expires_at)}
                        </span>
                      </Td>
                      {canEdit ? (
                        <Td className="text-right">
                          {invite.status === 'pendente' ? (
                            <form action={revokeInviteAction}>
                              <input
                                type="hidden"
                                name="inviteId"
                                value={invite.id}
                              />
                              <button
                                type="submit"
                                className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-danger-soft"
                              >
                                Cancelar
                              </button>
                            </form>
                          ) : (
                            <span className="text-[10px] text-ink-400">”</span>
                          )}
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
