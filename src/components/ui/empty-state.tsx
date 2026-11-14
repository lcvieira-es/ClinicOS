import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: IconType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-navy-700">
          <Icon className="h-6 w-6" strokeWidth={1.7} />
        </span>
      ) : null}
      <h3 className="text-sm font-bold text-navy-900">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
