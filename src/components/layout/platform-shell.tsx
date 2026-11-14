'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Bell,
  Building,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Avatar } from '@/components/ui/avatar';
import { AppFooter } from '@/components/layout/footer';
import { NavIcon } from '@/components/layout/nav-icon';
import { logoutAction } from '@/lib/auth/actions';
import { platformNav } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function PlatformShell({
  user,
  notificationCount,
  hasClinicAccess,
  children,
}: {
  user: { name: string; email: string; role: string };
  notificationCount: number;
  hasClinicAccess: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col bg-gradient-to-b from-navy-900 to-navy-950">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <Logo variant="light" withTagline />
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-3 mb-4 rounded-xl border border-mint-400/20 bg-mint-400/[0.06] p-3">
        <p className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-mint-300">
          <ShieldCheck className="h-3 w-3" />
          Superadministrador
        </p>
        <p className="mt-1 text-[14px] leading-relaxed text-white/45">
          Acesso administrativo. Dados clínicos não são exibidos por padrão.
        </p>
      </div>

      <nav className="clinicos-scroll flex-1 overflow-y-auto px-3 pb-4" aria-label="Menu da plataforma">
        {platformNav.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-2.5 text-[15px] font-bold uppercase tracking-[0.16em] text-white/30">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[17px] font-medium transition',
                        active
                          ? 'bg-mint-400 font-bold text-navy-950 shadow-[0_8px_18px_-12px_rgba(15,252,190,0.9)]'
                          : 'text-white/70 hover:bg-white/[0.07] hover:text-white',
                      )}
                    >
                      <NavIcon
                        name={item.icon}
                        className={cn(
                          'h-4 w-4 shrink-0',
                          active ? 'text-navy-900' : 'text-white/55 group-hover:text-mint-400',
                        )}
                        strokeWidth={active ? 2.1 : 1.8}
                      />
                      <span className="truncate">{item.label}</span>
                      {active ? <ChevronRight className="ml-auto h-3.5 w-3.5" /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-1 py-1">
          <Avatar name={user.name} size="sm" className="ring-white/10" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11.5px] font-semibold text-white">{user.name}</p>
            <p className="truncate text-[13px] text-white/45">{user.role}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Sair da conta"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent lg:pl-[336px]">
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 h-full w-[357px] shadow-pop">{sidebar}</aside>
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[336px] lg:block">{sidebar}</aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-600 hover:bg-sky-50 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[16px] font-bold text-navy-900">
                  Administração da plataforma
                </p>
                 
              </div>
              <p className="truncate text-[13px] text-ink-400">
                Clínicas, planos, assinaturas e pagamentos
              </p>
            </div>

            <form
              action="/admin/clinicas"
              method="get"
              className="relative hidden w-60 xl:block"
              role="search"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input
                name="q"
                type="search"
                placeholder="Buscar clínica ou CNPJ…"
                className="h-9 w-full rounded-xl border border-[#737373] bg-sky-50/70 pl-8 pr-3 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-navy-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-mint-400/15"
                aria-label="Buscar clínica"
              />
            </form>

            <Link
              href="/admin"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line text-ink-500 transition hover:border-navy-600/30 hover:bg-sky-50 hover:text-navy-900"
              aria-label={`Notificações (${notificationCount} não lidas)`}
              title="Notificações"
            >
              <Bell className="h-4 w-4" strokeWidth={1.9} />
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[12px] font-bold text-white ring-2 ring-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              ) : null}
            </Link>

            {hasClinicAccess ? (
              <Link
                href="/app/painel"
                className="hidden items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] font-bold text-navy-800 transition hover:bg-sky-50 md:inline-flex"
                title="Abrir ambiente da clínica"
              >
                <Building className="h-3.5 w-3.5" />
                Ambiente da clínica
              </Link>
            ) : null}

            <div className="hidden items-center gap-2.5 border-l border-line pl-3 sm:flex">
              <Avatar name={user.name} size="sm" />
              <div className="min-w-0">
                <p className="max-w-[150px] truncate text-[11.5px] font-semibold text-navy-900">
                  {user.name}
                </p>
                <p className="max-w-[150px] truncate text-[13px] text-ink-400">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</main>
        <AppFooter variant="platform" />
      </div>
    </div>
  );
}
