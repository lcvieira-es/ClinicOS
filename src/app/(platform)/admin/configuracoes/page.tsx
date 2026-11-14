import { requirePlatformAdmin } from '@/lib/auth/guards';
import { getPlatformPermissions } from '@/lib/permissions';
import { getPlatformSettings } from '@/lib/platform/admin-queries';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { SettingsForm } from '@/components/platform/settings-form';

export const metadata = { title: 'Configurações da plataforma' };

export default async function PlatformSettingsPage() {
  const user = await requirePlatformAdmin();
  const permissions = await getPlatformPermissions(user.id);
  const canEdit = permissions.has('plataforma-configuracoes:edit');

  const settings = await getPlatformSettings(user.id);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Administração da plataforma"
        title="Configurações"
        description="Identidade da plataforma, suporte, dias de teste, gateway padrão e observações de operação."
        actions={
          canEdit ? (
            <Badge tone="mint">Edição habilitada</Badge>
          ) : (
            <Badge tone="neutral">Somente leitura</Badge>
          )
        }
      />

      {!canEdit ? (
        <Alert variant="warning" title="Sem permissão de edição" className="mb-5">
          Seu perfil não possui permissão para editar as configurações (`plataforma-configuracoes:edit`).
        </Alert>
      ) : null}

      <Card className="max-w-3xl">
        <CardHeader
          title="Configurações gerais"
          description="Valores utilizados como padrão para novas clínicas e cobranças."
        />
        <CardBody>
          {canEdit ? (
            <SettingsForm settings={settings} />
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ['Nome da plataforma', settings.platformName],
                ['E-mail de suporte', settings.supportEmail],
                ['Dias de teste padrão', String(settings.defaultTrialDays)],
                ['Gateway padrão', settings.defaultGateway],
                ['Periodicidade padrão', settings.defaultPeriodicity],
                ['Modo do WhatsApp', settings.whatsappMode],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl bg-sky-25 px-3 py-2.5">
                  <dt className="text-[9px] font-bold uppercase tracking-wide text-ink-400">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-xs font-semibold text-navy-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
