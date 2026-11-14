import { ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/logo';

export function AppFooter({
  variant = 'clinic',
}: {
  variant?: 'clinic' | 'platform' | 'portal';
}) {
  const signature =
    variant === 'platform'
      ? 'ClinicOS · administração de clínicas, planos e assinaturas'
      : variant === 'portal'
        ? 'ClinicOS · portal do paciente'
        : 'ClinicOS · gestão integrada para clínicas médicas';

  const note =
    variant === 'platform'
      ? 'Ações do superadministrador registradas em auditoria.'
      : variant === 'portal'
        ? 'Seus dados são tratados conforme a LGPD.'
        : 'Dados tratados conforme a LGPD · ambiente auditado';

  return (
    <footer className="mt-auto border-t border-line bg-white/70 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-500">
        <span>{signature}</span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
          {note}
        </span>
      </div>
    </footer>
  );
}

export function AuthFooter() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Logo size="sm" variant="light" />
      <p className="text-[11px] text-white/50">
        ClinicOS · gestão integrada para clínicas médicas
      </p>
      <p className="text-[10px] text-white/35">
        Dados tratados conforme a LGPD · conexão segura
      </p>
    </div>
  );
}
