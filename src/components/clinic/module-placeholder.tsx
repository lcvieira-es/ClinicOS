import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NavIcon } from '@/components/layout/nav-icon';
import type { ModulePageConfig } from '@/lib/modules';

export function ModulePlaceholder({
  config,
  isDemo,
  planLabel,
}: {
  config: ModulePageConfig;
  isDemo: boolean;
  planLabel: string;
}) {
  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={
          <>
            <Badge tone="mint">Módulo liberado</Badge>
            <Badge tone="navy">Plano {planLabel}</Badge>
          </>
        }
      />

      {isDemo ? (
        <Alert variant="warning" title="Ambiente de demonstração" className="mb-5">
          Este módulo ainda não possui dados operacionais. A clínica demonstrativa
          utiliza apenas os registros fictícios exibidos no painel.
        </Alert>
      ) : null}

      <Alert
        variant="info"
        title="Estrutura de acesso pronta"
        className="mb-5"
        action={
          <ButtonLink href="/app/painel" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Painel
          </ButtonLink>
        }
      >
        A navegação, o controle de módulos pelo plano e a verificação de permissões
        já estão ativos. As telas operacionais deste módulo serão implementadas na
        próxima etapa, sem remover o que já funciona.
      </Alert>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-navy-800">
                  <NavIcon name={config.icon} className="h-4 w-4" />
                </span>
                O que este módulo entrega
              </span>
            }
            description="Funcionalidades previstas no escopo aprovado."
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
              <p className="text-[15px] font-bold uppercase tracking-[0.12em] text-mint-400">
                Próximo passo
              </p>
              <p className="mt-1 text-xl leading-relaxed text-white/75">
                Valide a fundação técnica e os layouts desta etapa. Em seguida, os
                módulos clínicos serão construídos sobre esta base.
              </p>
              <Link
                href="/app/painel"
                className="mt-2.5 inline-flex items-center gap-1 text-[16px] font-bold text-mint-400 hover:text-mint-300"
              >
                Voltar ao painel
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Controles aplicados"
            description="Segurança em camadas, não apenas na interface."
          />
          <CardBody className="space-y-3">
            {[
              {
                icon: ServerCog,
                title: 'Módulo verificado no plano',
                description:
                  'O servidor confere os entitlements do plano e adicionais antes de renderizar ou executar qualquer ação.',
              },
              {
                icon: ShieldCheck,
                title: 'Permissão por papel',
                description:
                  'A matriz RBAC valida a permissão do perfil ativo. Esconder o menu não é a proteção.',
              },
              {
                icon: LockKeyhole,
                title: 'Isolamento por clínica',
                description:
                  'Toda consulta roda em transação com clinic_id da sessão e RLS ativa no banco.',
              },
            ].map((control) => (
              <div key={control.title} className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint-400/15 text-emerald-700">
                  <control.icon className="h-4 w-4" strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-xl font-bold text-navy-900">{control.title}</p>
                  <p className="mt-0.5 text-[16px] leading-relaxed text-ink-500">
                    {control.description}
                  </p>
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-dashed border-line px-3 py-2.5 text-[15px] leading-relaxed text-ink-400">
              Auditoria encadeada por hash registra alterações em dados sensíveis.
              Acesso cruzado entre clínicas responde 404 para evitar enumeração.
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
