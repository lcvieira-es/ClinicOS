import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone =
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'mint'
  | 'navy';

const tones: Record<BadgeTone, string> = {
  success: 'bg-success-soft text-emerald-700 ring-emerald-600/10',
  danger: 'bg-danger-soft text-red-700 ring-red-600/10',
  warning: 'bg-warning-soft text-amber-700 ring-amber-600/10',
  info: 'bg-info-soft text-sky-700 ring-sky-600/10',
  neutral: 'bg-slate-100 text-ink-600 ring-slate-500/10',
  mint: 'bg-mint-400/20 text-emerald-800 ring-emerald-500/20',
  navy: 'bg-navy-900/5 text-navy-900 ring-navy-900/10',
};

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[15px] font-semibold ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

const statusMap: Record<string, { label: string; tone: BadgeTone }> = {
  ativa: { label: 'Ativa', tone: 'success' },
  ativo: { label: 'Ativo', tone: 'success' },
  inativa: { label: 'Inativa', tone: 'neutral' },
  inativo: { label: 'Inativo', tone: 'neutral' },
  agendada: { label: 'Agendada', tone: 'info' },
  confirmada: { label: 'Confirmada', tone: 'info' },
  aguardando: { label: 'Aguardando', tone: 'warning' },
  em_atendimento: { label: 'Em atendimento', tone: 'mint' },
  realizada: { label: 'Realizada', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
  faltou: { label: 'Faltou', tone: 'danger' },
  pendente: { label: 'Pendente', tone: 'warning' },
  pago: { label: 'Pago', tone: 'success' },
  paga: { label: 'Paga', tone: 'success' },
  atrasado: { label: 'Atrasado', tone: 'danger' },
  vencida: { label: 'Vencida', tone: 'danger' },
  em_teste: { label: 'Em teste', tone: 'info' },
  inadimplente: { label: 'Inadimplente', tone: 'danger' },
  suspensa: { label: 'Suspensa', tone: 'warning' },
  cancelado: { label: 'Cancelado', tone: 'neutral' },
  em_implantacao: { label: 'Em implantação', tone: 'warning' },
  arquivado: { label: 'Arquivado', tone: 'neutral' },
  aceito: { label: 'Aceito', tone: 'success' },
  expirado: { label: 'Expirado', tone: 'danger' },
  solicitado: { label: 'Solicitado', tone: 'info' },
  coletado: { label: 'Coletado', tone: 'info' },
  em_analise: { label: 'Em análise', tone: 'warning' },
  resultado_disponivel: { label: 'Resultado disponível', tone: 'success' },
  entregue: { label: 'Entregue', tone: 'success' },
  aberta: { label: 'Aberta', tone: 'warning' },
  bloqueado: { label: 'Bloqueado', tone: 'danger' },
  convidado: { label: 'Convidado', tone: 'info' },
  suspenso: { label: 'Suspenso', tone: 'warning' },
  removido: { label: 'Removido', tone: 'neutral' },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = statusMap[status] ?? { label: status, tone: 'neutral' as BadgeTone };
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  );
}
