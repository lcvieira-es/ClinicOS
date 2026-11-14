import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Pagination({
  page,
  pageSize,
  total,
  href,
}: {
  page: number;
  pageSize: number;
  total: number;
  href: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) {
    return (
      <p className="border-t border-line bg-slate-50/70 px-4 py-3 text-[11px] font-medium text-ink-500">
        {total} {total === 1 ? 'registro' : 'registros'}
      </p>
    );
  }

  const candidates = new Set<number>([1, pages, page - 1, page, page + 1]);
  const ordered = [...candidates]
    .filter((candidate) => candidate >= 1 && candidate <= pages)
    .sort((a, b) => a - b);

  const items: Array<number | '…'> = [];
  let previous = 0;
  for (const candidate of ordered) {
    if (previous && candidate - previous > 1) items.push('…');
    items.push(candidate);
    previous = candidate;
  }

  return (
    <nav
      className="flex items-center justify-between gap-3 border-t border-line bg-slate-50/70 px-4 py-3"
      aria-label="Paginação"
    >
      <p className="text-[11px] font-medium text-ink-500">
        {total} {total === 1 ? 'registro' : 'registros'} · página {page} de {pages}
      </p>

      <div className="flex items-center gap-1">
        <Link
          href={href(Math.max(1, page - 1))}
          aria-label="Página anterior"
          aria-disabled={page === 1}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg transition',
            page === 1
              ? 'pointer-events-none text-ink-300'
              : 'text-ink-500 hover:bg-sky-100 hover:text-navy-900',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        {items.map((item, index) =>
          item === '…' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1.5 text-[11px] text-ink-400"
            >
              …
            </span>
          ) : (
            <Link
              key={item}
              href={href(item)}
              aria-current={item === page ? 'page' : undefined}
              className={cn(
                'flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition',
                item === page
                  ? 'bg-navy-900 text-white'
                  : 'text-ink-500 hover:bg-sky-100 hover:text-navy-900',
              )}
            >
              {item}
            </Link>
          ),
        )}

        <Link
          href={href(Math.min(pages, page + 1))}
          aria-label="Próxima página"
          aria-disabled={page === pages}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg transition',
            page === pages
              ? 'pointer-events-none text-ink-300'
              : 'text-ink-500 hover:bg-sky-100 hover:text-navy-900',
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </nav>
  );
}
