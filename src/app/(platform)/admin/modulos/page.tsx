import {
  Boxes,
  ChevronDown,
  CircleCheck,
  Layers,
  Package,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { getPlatformPermissions } from '@/lib/permissions';
import { listModuleCatalog } from '@/lib/platform/admin-queries';
import { toggleModuleGlobalAction } from '@/lib/platform/actions';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmSubmitButton } from '@/components/ui/confirm-submit';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Módulos e funcionalidades' };

const categoryLabels: Record<string, string> = {
  operacao: 'Operação',
  clinico: 'Clínico',
  gestao: 'Gestão',
  cadastros: 'Cadastros',
  relacionamento: 'Relacionamento',
  sistema: 'Sistema',
};

export default async function PlatformModulesPage() {
  const user = await requirePlatformAdmin();
  const permissions = await getPlatformPermissions(user.id);
  const canEdit = permissions.has('plataforma-modulos:edit');

  const modules = await listModuleCatalog(user.id);

  const grouped = new Map<string, typeof modules>();
  for (const module of modules) {
    const key = module.category;
    const list = grouped.get(key) ?? [];
    list.push(module);
    grouped.set(key, list);
  }

  const categoryOrder = ['operacao', 'clinico', 'gestao', 'cadastros', 'relacionamento', 'sistema'];
  const activeCount = modules.filter((module) => module.is_active).length;
  const totalAdoption = modules.reduce((acc, module) => acc + module.adoption, 0);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Administração da plataforma"
        title="Módulos e funcionalidades"
        description="Catálogo por categoria, funcionalidades e adoção por clínica. Ativar/desativar um módulo globalmente afeta novas e futuras sessões das clínicas."
        actions={
          <>
            <Badge tone="navy">{modules.length} módulos</Badge>
            {canEdit ? <Badge tone="mint">Edição habilitada</Badge> : null}
          </>
        }
      />

      {!canEdit ? (
        <Alert variant="warning" title="Sem permissão de edição" className="mb-5">
          Seu perfil não possui permissão para ativar/desativar módulos (`plataforma-modulos:edit`).
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Módulos ativos"
          value={activeCount}
          hint={`${modules.length} no catálogo`}
          icon={Boxes}
          tone="navy"
        />
        <StatCard
          label="Core (sempre ativos)"
          value={modules.filter((module) => module.is_core).length}
          hint="Não removíveis por clínica"
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Ativações totais"
          value={totalAdoption}
          hint="Soma das clínicas com módulo ativo"
          icon={Layers}
          tone="mint"
        />
      </div>

      <div className="mt-6 space-y-5">
        {categoryOrder
          .filter((category) => grouped.has(category))
          .map((category) => {
            const items = grouped.get(category) ?? [];
            return (
              <Card key={category}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-navy-800" />
                      {categoryLabels[category] ?? category}
                    </span>
                  }
                  description={`${items.length} módulo(s) nesta categoria`}
                />
                <CardBody className="grid gap-3 grid-cols-1">
                  {items.map((module) => (
                    <div
                      key={module.id}
                      className={cn(
                        'flex flex-col rounded-2xl border p-4 transition',
                        module.is_active
                          ? 'border-line bg-sky-25'
                          : 'border-dashed border-line bg-slate-50/50 opacity-75',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-xl font-bold text-navy-900">{module.name}</p>
                            {module.is_core ? <Badge tone="success">Core</Badge> : null}
                            <Badge tone="neutral">{module.adoption} clínicas</Badge>
                          </div>
                          <p className="mt-0.5 font-mono text-[14px] text-ink-400">{module.key}</p>
                          {module.description ? (
                            <p className="mt-1 text-[16px] leading-relaxed text-ink-500">
                              {module.description}
                            </p>
                          ) : null}
                        </div>
                        {canEdit && !module.is_core ? (
                          <form action={toggleModuleGlobalAction} className="shrink-0">
                            <input type="hidden" name="moduleId" value={module.id} />
                            <input type="hidden" name="next" value={module.is_active ? 'false' : 'true'} />
                            <ConfirmSubmitButton
                              className={cn(
                                'flex items-center gap-1 rounded-lg px-2 py-1.5 text-[15px] font-bold transition',
                                module.is_active
                                  ? 'text-red-600 hover:bg-danger-soft/60'
                                  : 'text-emerald-700 hover:bg-success-soft/60',
                              )}
                              confirm={
                                module.is_active
                                  ? `Desativar "${module.name}" globalmente? As clínicas perderão acesso imediatamente.`
                                  : `Reativar "${module.name}" globalmente?`
                              }
                            >
                              {module.is_active ? (
                                <>
                                  <ToggleRight className="h-4 w-4" strokeWidth={2} />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-4 w-4" strokeWidth={2} />
                                  Ativar
                                </>
                              )}
                            </ConfirmSubmitButton>
                          </form>
                        ) : null}
                      </div>

                      {module.features.length > 0 ? (
                        <details className="mt-3 border-t border-line/70 pt-3">
                          <summary className="flex cursor-pointer items-center justify-between text-[15px] font-bold uppercase tracking-wide text-ink-400 transition hover:text-navy-900">
                            Funcionalidades ({module.features.length})
                            <ChevronDown className="h-3.5 w-3.5" />
                          </summary>
                          <ul className="mt-2 grid gap-1.5 grid-cols-1">
                            {module.features.map((feature) => (
                              <li
                                key={feature.id}
                                className="flex items-start gap-1.5 text-[15px] leading-snug text-ink-600"
                              >
                                <CircleCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                                {feature.name}
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </div>
                  ))}
                </CardBody>
              </Card>
            );
          })}
      </div>

      {modules.length === 0 ? (
        <Card className="mt-6">
          <EmptyState
            icon={Boxes}
            title="Catálogo vazio"
            description="Execute as migrations para carregar o catálogo de módulos."
          />
        </Card>
      ) : null}
    </div>
  );
}
