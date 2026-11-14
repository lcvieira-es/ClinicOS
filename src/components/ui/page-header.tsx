import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex items-start gap-2.5">
          <span className="mt-1.5 h-6 w-1 shrink-0 rounded-full bg-mint-400" aria-hidden />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-500 sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
