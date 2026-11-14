import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

const toneStyles = {
  navy: {
    icon: 'bg-navy-900/8 text-navy-900',
    value: 'text-navy-900',
  },
  mint: {
    icon: 'bg-mint-400/20 text-emerald-700',
    value: 'text-navy-900',
  },
  success: {
    icon: 'bg-success-soft text-success',
    value: 'text-navy-900',
  },
  danger: {
    icon: 'bg-danger-soft text-danger',
    value: 'text-navy-900',
  },
  warning: {
    icon: 'bg-warning-soft text-warning',
    value: 'text-navy-900',
  },
  info: {
    icon: 'bg-info-soft text-info',
    value: 'text-navy-900',
  },
} as const;

export type StatTone = keyof typeof toneStyles;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'navy',
  trend,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: IconType;
  tone?: StatTone;
  trend?: { value: string; direction: 'up' | 'down' | 'flat'; positive?: boolean };
  className?: string;
}) {
  const styles = toneStyles[tone];
  return (
    <div
      className={cn(
        'group rounded-card border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-ink-500">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              styles.icon,
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
        ) : null}
      </div>
      <p className={cn('mt-2 text-2xl font-bold tracking-tight', styles.value)}>{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {trend ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-bold',
              trend.positive === false
                ? 'text-danger'
                : trend.direction === 'up'
                  ? 'text-success'
                  : trend.direction === 'down'
                    ? 'text-danger'
                    : 'text-ink-500',
            )}
          >
            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '•'}
            {trend.value}
          </span>
        ) : null}
        {hint ? <span className="text-[11px] font-bold text-ink-500">{hint}</span> : null}
      </div>
    </div>
  );
}
