import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'h-10 w-full rounded-xl border border-[#737373] bg-white px-3 text-[15px] text-ink-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] transition placeholder:text-ink-400',
        'hover:border-[#737373] focus:border-navy-600 focus:outline-none focus:ring-4 focus:ring-mint-400/20',
        'disabled:cursor-not-allowed disabled:bg-sky-50 disabled:text-ink-400',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-10 w-full appearance-none rounded-xl border border-[#737373] bg-white px-3 pr-9 text-[15px] text-ink-900 transition',
        'hover:border-[#737373] focus:border-navy-600 focus:outline-none focus:ring-4 focus:ring-mint-400/20',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  rows = 3,
  ...props
}: ComponentProps<'textarea'>) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full resize-y rounded-xl border border-[#737373] bg-white px-3 py-2 text-[15px] leading-relaxed text-ink-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] transition placeholder:text-ink-400',
        'hover:border-[#737373] focus:border-navy-600 focus:outline-none focus:ring-4 focus:ring-mint-400/20',
        'disabled:cursor-not-allowed disabled:bg-sky-50 disabled:text-ink-400',
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, children, ...props }: ComponentProps<'label'>) {
  return (
    <label
      className={cn('mb-1.5 block text-[15px] font-semibold text-ink-600', className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('w-full', className)}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-[15px] font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[15px] text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}
