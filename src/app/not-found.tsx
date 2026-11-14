import Link from 'next/link';
import { ArrowLeft, ShieldQuestion } from 'lucide-react';

export const metadata = {
  title: 'Página não encontrada · ClinicOS',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">
          Erro 404
        </p>

        <span className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 shadow-card">
          <ShieldQuestion className="h-7 w-7 text-mint-400" strokeWidth={1.8} />
        </span>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-navy-900">
          Página não encontrada
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
          O endereço pode ter sido movido, ou você não tem permissão para acessá-lo.
          Se precisar de ajuda, fale com o administrador.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white transition hover:bg-navy-800"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
