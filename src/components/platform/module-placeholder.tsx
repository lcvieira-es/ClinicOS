import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Database,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NavIcon } from '@/components/layout/nav-icon';
import type { PlatformModulePageConfig } from '@/lib/platform/modules';

export function PlatformModulePlaceholder({
  config,
}: {
  config: PlatformModulePageConfig;
}) {
  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Administração da plataforma"
        title={config.title}
        description={config.description}
        actions={
          <>
            <Badge tone="navy">Superadministrador</Badge>
            <Badge tone="mint">Estrutura pronta</Badge>
          </>
        }
      />

      <Alert
        variant="info"
        title="Fundação administrativa pronta"
        className="mb-5"
        action={
          <ButtonLink href="/admin" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </ButtonLink>
        }
      >
        Rotas, layout, catálogo e permissões da plataforma já estão ativos. As telas
        operacionais desta área serão implementadas na próxima etapa.
      </Alert>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-navy-800">
                  <NavIcon name={config.icon} className="h-4 w-4" />
                </span>
                Escopo deste módulo
              </span>
            }
            description="Funcionalidades previstas para a administração da plataforma."
          />
          <CardBody>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {config.capabilities.map((capability) => (
                <li
                  key={capability}
                  className="flex items-start gap-2 rounded-xl border border-line bg-sky-25 px-3 py-2.5"
                >
                  <CircleCheck
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                    strokeWidth={2}
                  />
                  <span className="text-[11.5px] leading-relaxed text-ink-600">
                    {capability}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-xl bg-navy-900 px-4 py-3.5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-mint-400">
                Próximo passo
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/75">
                Valide a fundação, o design system e as três interfaces. Depois,
                seguimos para as telas operacionais e clínicas.
              </p>
              <Link
                href="/admin"
                className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-mint-400 hover:text-mint-300"
              >
                Voltar ao dashboard
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Controles da plataforma"
            description="Privilégio mínimo e rastreabilidade."
          />
          <CardBody className="space-y-3">
            {[
              {
                icon: ShieldCheck,
                title: 'Sem acesso clínico por padrão',
                description:
                  'O superadministrador não abre prontuário, receita ou financeiro da clínica.',
              },
              {
                icon: LockKeyhole,
                title: 'Permissões de plataforma',
                description:
                  'Cada rota valida a permissão do papel platform_admin no servidor.',
              },
              {
                icon: Database,
                title: 'Auditoria encadeada',
                description:
                  'Alterações em planos, módulos, assinaturas e configurações geram eventos com hash.',
              },
            ].map((control) => (
              <div key={control.title} className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint-400/15 text-emerald-700">
                  <control.icon className="h-4 w-4" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-xs font-bold text-navy-900">{control.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">
                    {control.description}
                  </p>
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-dashed border-line px-3 py-2.5 text-[10px] leading-relaxed text-ink-400">
              Métricas da plataforma são agregadas. Dados de pacientes não são
              consultados nesta interface.
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
