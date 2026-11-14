import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function TableShell({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('table-shell', className)} {...props} />;
}

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return <table className={cn('data-table', className)} {...props} />;
}

export function Th({ className, ...props }: ComponentProps<'th'>) {
  return <th className={cn(className)} {...props} />;
}

export function Td({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn(className)} {...props} />;
}

export function TableEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-xs text-ink-500">
        {children}
      </td>
    </tr>
  );
}

export function TableFooter({
  summary,
  children,
}: {
  summary: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-slate-50/70 px-4 py-3">
      <p className="text-[11px] font-medium text-ink-500">{summary}</p>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

export function PageButton({
  children,
  active = false,
  disabled = false,
}: {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition',
        active
          ? 'bg-navy-900 text-white'
          : 'text-ink-500 hover:bg-sky-100 hover:text-navy-900',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      {children}
    </button>
  );
}
