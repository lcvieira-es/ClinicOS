import { cn } from '@/lib/utils';

export function Logo({
  variant = 'dark',
  size = 'md',
  withTagline = false,
  className,
}: {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  withTagline?: boolean;
  className?: string;
}) {
  const marks = {
    sm: 'h-7 w-7 rounded-lg',
    md: 'h-9 w-9 rounded-xl',
    lg: 'h-11 w-11 rounded-2xl',
  };
  const text = {
    sm: 'text-[19px]',
    md: 'text-[21px]',
    lg: 'text-[27px]',
  };
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative flex shrink-0 items-center justify-center bg-navy-900 shadow-[0_8px_18px_-10px_rgba(9,61,105,0.9)] ring-1 ring-white/10',
          marks[size],
        )}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="none">
          <path
            d="M12 4.5v15M4.5 12h15"
            stroke="#0FFCBE"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block font-bold leading-none tracking-tight',
            text[size],
            variant === 'light' ? 'text-white' : 'text-navy-900',
          )}
        >
          Clinic<span className="text-mint-400">OS</span>
        </span>
        {withTagline ? (
          <span
            className={cn(
              'mt-1 block text-[13px] font-medium tracking-wide',
              variant === 'light' ? 'text-white/55' : 'text-ink-400',
            )}
          >
            Gestão integrada para clínicas
          </span>
        ) : null}
      </span>
    </span>
  );
}
