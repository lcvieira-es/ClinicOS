import { requirePlatformAdmin } from '@/lib/auth/guards';
import { getPlatformPermissions } from '@/lib/permissions';
import { listPlans } from '@/lib/platform/admin-queries';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PlanManager } from '@/components/platform/plan-manager';

export const metadata = { title: 'Planos de assinatura' };

export default async function PlatformPlansPage() {
  const user = await requirePlatformAdmin();
  const permissions = await getPlatformPermissions(user.id);
  const canEdit = permissions.has('plataforma-planos:edit');

  const plans = await listPlans(user.id);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Administração da plataforma"
        title="Planos de assinatura"
        description="Catálogo comercial com preços mensal e anual, limites de uso e composição de módulos."
        actions={
          <>
            <Badge tone="navy">{plans.length} planos</Badge>
            {canEdit ? <Badge tone="mint">Edição habilitada</Badge> : <Badge tone="neutral">Somente leitura</Badge>}
          </>
        }
      />

      {!canEdit ? (
        <Alert variant="warning" title="Sem permissão de edição" className="mb-5">
          Seu perfil não possui permissão para editar planos (`plataforma-planos:edit`).
        </Alert>
      ) : null}

      <PlanManager plans={plans} canEdit={canEdit} />
    </div>
  );
}
