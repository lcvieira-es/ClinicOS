import { notFound } from 'next/navigation';
import { getPlan, whatsappPlanUrl } from '@/lib/marketing/plans';

export default async function PlanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plan = getPlan(slug);
  if (!plan) notFound();

  return (
    <div className="min-h-screen bg-sky-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm text-navy-600 hover:underline">← Voltar</a>
        <h1 className="mt-4 text-3xl font-bold text-navy-900">{plan.name}</h1>
        <p className="mt-2 text-ink-500">{plan.tagline}</p>
        <p className="mt-6 text-4xl font-bold text-navy-900">
          {plan.monthly} <span className="text-base font-medium text-ink-500">/mês</span>
        </p>
        <p className="mt-1 text-sm text-ink-500">{plan.yearly}</p>
        <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
          {([
            ['Usuários', plan.users],
            ['Profissionais', plan.professionals],
            ['Unidades', plan.units],
            ['Pacientes', plan.patients],
            ['Armazenamento', plan.storage],
            ['Mensagens', plan.messages],
            ['Interações IA', plan.aiInteractions],
            ['Teste', plan.trial],
          ] as const).map(([label, value]) => (
            <div key={label} className="rounded-xl border border-line bg-white p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</dt>
              <dd className="mt-1 font-bold text-navy-900">{value}</dd>
            </div>
          ))}
        </div>
        <ul className="mt-8 space-y-2 text-sm text-navy-900">
          {plan.benefits.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-mint-400" />
              {b}
            </li>
          ))}
        </ul>
        <a
          href={whatsappPlanUrl(plan.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 font-semibold text-white hover:bg-navy-700"
        >
          Falar no WhatsApp
        </a>
      </div>
    </div>
  );
}
