import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { getClinicSettings } from '@/lib/clinic/configuracoes';
import { updateClinicSettingsAction } from '@/lib/clinic/actions/configuracoes';
import { PageHeader } from '@/components/ui/page-header';
import { CepAutoFill } from '@/components/clinic/cep-auto-fill';
import { PhoneAutoFill } from '@/components/clinic/phone-auto-fill';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Field, Input } from '@/components/ui/input';

export const metadata = { title: 'Configurações' };

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('configuracoes');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canEdit = access.permissions.has('configuracoes:edit');

  const settings = await getClinicSettings(user.id, user.activeClinicId);
  if (!settings) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Sistema"
        title="Configurações"
        description="Dados da clínica e preferências."
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
        <CardHeader title="Dados da clínica" description="Identificação e contato." />
        <CardBody>
          {canEdit ? (
            <form action={updateClinicSettingsAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Nome de exibição *" htmlFor="displayName">
                  <Input id="displayName" name="displayName" required defaultValue={settings.display_name} />
                </Field>
                <Field label="Nome fantasia" htmlFor="tradeName">
                  <Input id="tradeName" name="tradeName" defaultValue={settings.trade_name ?? ''} />
                </Field>
                <Field label="E-mail" htmlFor="email">
                  <Input id="email" name="email" type="email" defaultValue={settings.email ?? ''} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Telefone" htmlFor="phone">
                  <Input id="phone" name="phone" defaultValue={settings.phone ?? ''} />
                </Field>
                <Field label="WhatsApp" htmlFor="whatsapp">
                  <Input id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp ?? ''} />
                </Field>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <Field label="CEP" htmlFor="cep" className="w-[20%]">
                  <Input id="cep" name="cep" defaultValue={settings.cep ?? ''} />
                </Field>
                <Field label="Endereço" htmlFor="address" className="w-[30%]">
                  <Input id="address" name="address" defaultValue={settings.address ?? ''} />
                </Field>
                <Field label="Número" htmlFor="addressNumber" className="w-[20%]">
                  <Input id="addressNumber" name="addressNumber" defaultValue={settings.address_number ?? ''} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Complemento" htmlFor="complement">
                  <Input id="complement" name="complement" defaultValue={settings.complement ?? ''} />
                </Field>
                <Field label="Bairro" htmlFor="neighborhood">
                  <Input id="neighborhood" name="neighborhood" defaultValue={settings.neighborhood ?? ''} />
                </Field>
                <Field label="Cidade" htmlFor="city">
                  <Input id="city" name="city" defaultValue={settings.city ?? ''} />
                </Field>
                <Field label="UF" htmlFor="state">
                  <Input id="state" name="state" maxLength={2} defaultValue={settings.state ?? ''} className="uppercase" />
                </Field>
              </div>
              <Field label="Observações" htmlFor="notes">
                <Input id="notes" name="notes" defaultValue={settings.notes ?? ''} />
              </Field>
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition hover:bg-navy-800"
                >
                  Salvar configurações
                </button>
              </div>
            <CepAutoFill />
              <PhoneAutoFill />
              </form>
          ) : (
            <dl className="grid gap-2 text-[11px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">Nome de exibição</dt>
                <dd className="font-semibold text-ink-700">{settings.display_name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">E-mail</dt>
                <dd className="font-semibold text-ink-700">{settings.email ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">Telefone</dt>
                <dd className="font-semibold text-ink-700">{settings.phone ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">Cidade/UF</dt>
                <dd className="font-semibold text-ink-700">
                  {[settings.city, settings.state].filter(Boolean).join(' / ') || '—'}
                </dd>
              </div>
            </dl>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
