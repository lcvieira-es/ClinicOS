import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'mint';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-navy-900 text-white shadow-[0_10px_24px_-14px_rgba(9,61,105,0.9)] hover:bg-navy-800 active:bg-navy-950 disabled:bg-navy-900/50',
  secondary:
    'bg-sky-100 text-navy-900 hover:bg-sky-200 active:bg-sky-200 disabled:bg-sky-100/60',
  outline:
    'border border-line bg-white text-ink-700 hover:border-navy-600/40 hover:text-navy-900 hover:bg-sky-25 disabled:text-ink-400',
  ghost:
    'text-ink-600 hover:bg-sky-100 hover:text-navy-900 disabled:text-ink-400',
  danger:
    'bg-danger text-white hover:bg-red-700 active:bg-red-800 disabled:bg-danger/50',
  mint: 'bg-mint-400 text-navy-950 hover:bg-mint-300 active:bg-mint-500 disabled:bg-mint-400/50',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-11 gap-2 rounded-xl px-5 text-sm',
  icon: 'h-10 w-10 rounded-xl',
};

export function buttonStyles(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors disabled:cursor-not-allowed',
    variantStyles[options?.variant ?? 'primary'],
    sizeStyles[options?.size ?? 'md'],
    options?.className,
  );
}

type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}
