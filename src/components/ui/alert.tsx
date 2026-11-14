import type { ComponentType, ReactNode } from 'react';
import {
  CircleCheck,
  CircleX,
  Info,
  TriangleExclamationPoint,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

const variants = {
  info: {
    wrap: 'border-sky-200 bg-info-soft/60 text-sky-800',
    icon: 'text-info',
    Icon: Info,
  },
  success: {
    wrap: 'border-emerald-200 bg-success-soft/60 text-emerald-800',
    icon: 'text-success',
    Icon: CircleCheck,
  },
  warning: {
    wrap: 'border-amber-200 bg-warning-soft/60 text-amber-800',
    icon: 'text-warning',
    Icon: TriangleExclamationPoint,
  },
  danger: {
    wrap: 'border-red-200 bg-danger-soft/60 text-red-800',
    icon: 'text-danger',
    Icon: CircleX,
  },
  mint: {
    wrap: 'border-emerald-200 bg-mint-400/10 text-navy-900',
    icon: 'text-emerald-600',
    Icon: CircleCheck,
  },
} as const;

export function Alert({
  variant = 'info',
  title,
  children,
  action,
  className,
  icon: CustomIcon,
}: {
  variant?: keyof typeof variants;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  icon?: IconType;
}) {
  const meta = variants[variant];
  const Icon = CustomIcon ?? meta.Icon;
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
        meta.wrap,
        className,
      )}
      role="status"
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', meta.icon)} strokeWidth={2} />
      <div className="min-w-0 flex-1">
        {title ? <p className="text-xs font-bold">{title}</p> : null}
        {children ? <div className="text-xs leading-relaxed opacity-90">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
