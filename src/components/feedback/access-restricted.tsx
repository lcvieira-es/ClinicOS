import Link from 'next/link';
import { ArrowLeft, LockKeyhole } from 'lucide-react';

export function AccessRestricted({
  homeHref,
  homeLabel,
}: {
  homeHref: string;
  homeLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">
        Acesso restrito
      </p>

      <span className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 shadow-card">
        <LockKeyhole className="h-7 w-7 text-mint-400" strokeWidth={1.8} />
      </span>

      <h1 className="mt-4 text-xl font-bold tracking-tight text-navy-900">
        Módulo indisponível para o seu perfil
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-ink-500">
        Você não tem permissão para abrir este módulo, ou ele não está incluído no
        plano da clínica. Se precisar de acesso, fale com o administrador.
      </p>

      <Link
        href={homeHref}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-navy-900 px-4 text-xs font-semibold text-white transition hover:bg-navy-800"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        {homeLabel}
      </Link>
    </div>
  );
}
