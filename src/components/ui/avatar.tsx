import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';

const palette = [
  'bg-navy-900 text-white',
  'bg-emerald-600 text-white',
  'bg-sky-600 text-white',
  'bg-amber-500 text-white',
  'bg-rose-600 text-white',
  'bg-violet-600 text-white',
];

function pickColor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 997;
  }
  return palette[hash % palette.length];
}

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  };
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-white/60',
        sizes[size],
        pickColor(name),
        className,
      )}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
