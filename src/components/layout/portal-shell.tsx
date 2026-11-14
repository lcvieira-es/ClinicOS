'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Avatar } from '@/components/ui/avatar';
import { AppFooter } from '@/components/layout/footer';
import { NavIcon } from '@/components/layout/nav-icon';
import { logoutAction } from '@/lib/auth/actions';
import type { NavGroup } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function PortalShell({
  patientName,
  clinicName,
  nav,
  children,
}: {
  patientName: string;
  clinicName: string;
  nav: NavGroup[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const items = nav.flatMap((group) => group.items);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="h-1 bg-mint-400" />
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Logo size="sm" />
          <div className="hidden min-w-0 border-l border-line pl-3 sm:block">
            <p className="truncate text-[14px] font-bold text-navy-900">{clinicName}</p>
            <p className="text-[13px] text-ink-400">Portal do paciente</p>
          </div>

          <nav className="clinicos-scroll-light ml-auto hidden items-center gap-1 overflow-x-auto md:flex">
            {items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/portal' && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-[11.5px] font-semibold transition',
                    active
                      ? 'bg-navy-900 text-white'
                      : 'text-ink-500 hover:bg-sky-100 hover:text-navy-900',
                  )}
                >
                  <NavIcon name={item.icon} className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-3">
            <Avatar name={patientName} size="sm" />
            <div className="hidden min-w-0 lg:block">
              <p className="max-w-[140px] truncate text-[14px] font-bold text-navy-900">
                {patientName}
              </p>
              <p className="text-[13px] text-ink-400">Paciente</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-ink-500 transition hover:bg-sky-50 hover:text-navy-900"
                aria-label="Sair do portal"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="clinicos-scroll-light flex gap-1 overflow-x-auto border-t border-line px-3 py-2 md:hidden">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/portal' && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[14px] font-semibold transition',
                  active
                    ? 'bg-navy-900 text-white'
                    : 'text-ink-500 hover:bg-sky-100 hover:text-navy-900',
                )}
              >
                <NavIcon name={item.icon} className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-ink-500 shadow-card">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Este portal exibe somente os seus próprios registros. Em caso de dúvida
            sobre um documento, fale com a clínica.
          </span>
        </div>
      </div>

      <AppFooter variant="portal" />
    </div>
  );
}
