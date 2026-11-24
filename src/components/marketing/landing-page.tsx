'use client';

import Link from 'next/link';
import {
  Activity,
  CalendarCheck,
  HeartPulse,
  MessageCircle,
  Package,
  ShieldCheck,
  Stethoscope,
  BarChart3,
  Pill,
  Syringe,
  Smartphone,
  Check,
  LayoutGrid,
  Building2,
  Timer,
} from 'lucide-react';
import { plans, freeTrial } from '@/lib/marketing/plans';
import { RegistrationModal } from '@/components/marketing/registration-modal';

const features = [
  { icon: CalendarCheck, t: 'Agenda inteligente', d: 'Marcações online, confirmação automática e redução de faltas em até 40%.' },
  { icon: MessageCircle, t: 'Automação via WhatsApp', d: 'Lembretes, confirmações e pesquisas de satisfação enviados sem esforço.' },
  { icon: Stethoscope, t: 'Prontuário eletrônico', d: 'Histórico completo do paciente, seguro e acessível em qualquer consultório.' },
  { icon: Package, t: 'Gestão ágil de estoque', d: 'Controle de insumos e medicamentos com alertas de reposição.' },
  { icon: BarChart3, t: 'Financeiro e relatórios', d: 'Faturamento, convênios e indicadores em painéis claros e em tempo real.' },
  { icon: ShieldCheck, t: 'Segurança e LGPD', d: 'Dados criptografados, backups diários e conformidade total.' },
];

function Floating({ icon: I, className }: { icon: typeof Pill; className: string }) {
  return (
    <div className={`absolute hidden md:flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-navy-900 shadow-lg ${className}`}>
      <I className="h-7 w-7" />
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-sky-50 text-ink-900">
      <header className="sticky top-0 z-50 border-b border-line/60 bg-sky-50/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="text-2xl font-bold text-navy-900">
            Clinic<span className="text-mint-400">OS</span>
          </a>
          <ul className="hidden gap-8 text-sm font-medium text-ink-500 md:flex">
            {['Recursos', 'Experiência', 'Resultados', 'Planos'].map((l) => (
              <li key={l}>
                <a href={`#${l.toLowerCase()}`} className="hover:text-navy-900">
                  {l}
                </a>
              </li>
            ))}
          </ul>
          <a href="#contato" className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-700">
            Agendar demonstração
          </a>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <Floating icon={HeartPulse} className="left-2 top-10 float text-mint-400" />
        <Floating icon={Pill} className="right-6 top-6 float-slow" />
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-navy-900">
            <Activity className="h-4 w-4" /> Tecnologia para saúde
          </span>
          <h1 className="mt-6 text-3xl font-bold leading-tight text-navy-900 md:text-5xl">
            A evolução inteligente na <span className="text-navy-600">gestão de clínicas</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-ink-500">
            Da recepção ao consultório, o ClinicOS conecta equipe e pacientes em uma experiência fluida, humana e digital. Menos burocracia, mais cuidado.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#contato" className="rounded-full bg-navy-900 px-7 py-3.5 font-semibold text-white shadow-lg hover:bg-navy-700">
              Começar agora
            </a>
            <a href="#recursos" className="rounded-full border-2 border-mint-400 px-7 py-3.5 font-semibold text-navy-900 hover:bg-mint-400/20">
              Conhecer recursos
            </a>
          </div>
          <div className="mt-10 flex gap-10">
            {[['+1.200', 'clínicas'], ['2M', 'consultas/mês'], ['98%', 'satisfação']].map(([n, l]) => (
              <div key={l}>
                <p className="text-2xl font-bold text-navy-600">{n}</p>
                <p className="text-sm text-ink-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-[3rem] bg-mint-400/25 blur-3xl" />
          <img src="/hero.jpg" alt="ClinicOS" className="fade-edges relative w-full rounded-[2.5rem]" />
          <div className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-lg float-slow">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-400/30 text-navy-900">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Consulta confirmada</p>
              <p className="text-xs text-ink-500">via WhatsApp · agora</p>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="relative bg-sky-100/60 py-20">
        <Floating icon={Syringe} className="right-10 top-16 float" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold uppercase tracking-wider text-mint-400">Recursos</p>
            <h2 className="mt-3 text-2xl font-bold text-navy-900 md:text-3xl">Tudo que sua clínica precisa, em um só lugar</h2>
            <p className="mt-4 text-ink-500">Uma plataforma completa, pensada por médicos e gestores, para simplificar cada etapa da jornada do paciente.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: I, t, d }) => (
              <div key={t} className="group rounded-3xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-900 text-white group-hover:bg-mint-400 group-hover:text-navy-900">
                  <I className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-navy-900">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="experiência" className="mx-auto max-w-7xl space-y-28 px-6 py-24">
        {[
          { img: '/reception.jpg', tag: 'Recepção', t: 'Um acolhimento que começa antes da chegada', d: 'Check-in digital, fila organizada e cadastro instantâneo. Sua recepcionista recebe cada paciente pelo nome, com todas as informações à mão.', pts: ['Check-in por QR Code', 'Cadastro integrado a convênios', 'Painel de chamada inteligente'] },
          { img: '/doctor.jpg', tag: 'Consultório', t: 'Médicos focados no que importa: o paciente', d: 'Prontuário intuitivo, prescrição digital e histórico completo em uma tela. Atendimentos mais humanos e decisões mais seguras.', pts: ['Prescrição eletrônica certificada', 'Modelos de anamnese personalizados', 'Telemedicina integrada'] },
          { img: '/waiting.jpg', tag: 'Sala de espera', t: 'Conforto e transparência enquanto aguardam', d: 'Pacientes acompanham o tempo de espera pelo celular e recebem avisos quando chegar sua vez. Menos ansiedade, mais tranquilidade.', pts: ['Tempo de espera em tempo real', 'Notificações automáticas', 'Pesquisa de satisfação pós-consulta'] },
        ].map((b, i) => (
          <div key={b.tag} className="relative grid items-center gap-12 lg:grid-cols-2">
            {i === 1 && <Floating icon={Smartphone} className="-left-2 -top-8 float" />}
            <div className={`relative ${i % 2 ? 'lg:order-2' : ''}`}>
              <div className="absolute -inset-4 rounded-[3rem] bg-navy-900/10 blur-2xl" />
              <img src={b.img} alt={b.t} loading="lazy" className="fade-edges relative w-full rounded-[2.5rem]" />
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-mint-400">{b.tag}</p>
              <h2 className="mt-3 text-3xl font-bold text-navy-900 md:text-4xl">{b.t}</h2>
              <p className="mt-4 text-base text-ink-500">{b.d}</p>
              <ul className="mt-6 space-y-3">
                {b.pts.map((p) => (
                  <li key={p} className="flex items-center gap-3 font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint-400/30 text-navy-900">
                      <Check className="h-4 w-4" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-navy-900 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 text-center sm:grid-cols-2 lg:grid-cols-4">
          {[['-40%', 'faltas em consultas'], ['3h', 'economizadas por dia'], ['+35%', 'faturamento médio'], ['24/7', 'suporte especializado']].map(([n, l]) => (
            <div key={l} className="rounded-3xl border border-white/15 bg-white/5 p-8">
              <p className="text-3xl font-bold text-mint-400">{n}</p>
              <p className="mt-2 opacity-80">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-center text-3xl font-bold text-navy-900 md:text-4xl">Quem usa, recomenda</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            ['Dra. Helena Costa', 'Clínica Vida Plena', 'Reduzimos as faltas pela metade com os lembretes no WhatsApp. A equipe trabalha mais leve.'],
            ['Dr. Rafael Lima', 'Ortopedia Lima', 'O prontuário é rápido e intuitivo. Ganho tempo em cada consulta para conversar com o paciente.'],
            ['Mariana Souza', 'Gestora, Instituto Saúde+', 'O controle de estoque e o financeiro finalmente estão organizados. Decidimos com dados reais.'],
          ].map(([n, c, q]) => (
            <figure key={n} className="rounded-3xl border border-line bg-white p-6 shadow-lg">
              <blockquote className="text-ink-500">“{q}”</blockquote>
              <figcaption className="mt-6">
                <p className="font-semibold text-navy-900">{n}</p>
                <p className="text-sm text-mint-400">{c}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="planos" className="bg-sky-100/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold uppercase tracking-wider text-mint-400">Planos</p>
            <h2 className="mt-3 text-3xl font-bold text-navy-900 md:text-4xl">Escolha o plano ideal para sua clínica</h2>
            <p className="mt-4 text-ink-500">Todos os planos incluem 14 dias de teste grátis, sem compromisso e sem fidelidade.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col rounded-3xl border border-mint-400 bg-mint-400/10 p-6 xl:p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-400/30 text-navy-900">
                <Timer className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-navy-900">Avaliação gratuita</h3>
              <p className="mt-3 text-sm text-ink-500">Conheça o ClinicOS antes de escolher o plano para sua clínica.</p>
              <p className="mt-6 text-4xl font-bold text-navy-900">{freeTrial.days} dias</p>
              <p className="mt-1 text-sm font-semibold text-navy-600">Grátis · R$ {freeTrial.price},00</p>
              <div className="my-6 border-t border-line" />
              <ul className="space-y-4 text-sm text-navy-900">
                {['Experimente a gestão da sua clínica', 'Conheça os recursos da plataforma', 'Avalie com sua equipe', 'Escolha seu plano depois do teste'].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <p className="mb-6 mt-6 text-xs text-ink-500">Sem compromisso e sem fidelidade.</p>
              <RegistrationModal />
            </div>
            {plans.map((p) => (
              <Link
                key={p.slug}
                href={`/planos/${p.slug}`}
                className={`group flex flex-col rounded-3xl border bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg xl:p-6 ${p.highlighted ? 'border-mint-400 ring-2 ring-mint-400/40' : 'border-line'}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-navy-900">{p.name}</h3>
                  {p.highlighted && <span className="rounded-full bg-mint-400/30 px-2 py-1 text-center text-xs font-semibold text-navy-900">Mais popular</span>}
                </div>
                <p className="mt-1 text-xs text-ink-500">{p.slug}</p>
                <p className="mt-3 text-sm text-ink-500">{p.tagline}</p>
                <p className="mt-6 text-3xl font-bold text-navy-900">
                  {p.monthly} <span className="block text-base font-medium text-ink-500">/mês</span>
                </p>
                <p className="mt-1 text-xs text-ink-500">{p.yearly}</p>
                <div className="my-6 border-t border-line" />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  {([
                    ['Usuários', p.users],
                    ['Profissionais', p.professionals],
                    ['Unidades', p.units],
                    ['Pacientes', p.patients],
                    ['Armazenamento', p.storage],
                    ['Mensagens', p.messages],
                    ['Interações IA', p.aiInteractions],
                  ] as const).map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</dt>
                      <dd className="mt-0.5 font-bold text-navy-900">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="my-6 border-t border-line" />
                <div className="flex items-center justify-between text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1.5">
                    <LayoutGrid className="h-4 w-4" /> {p.modules}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" /> {p.units} {Number(p.units) === 1 ? 'unidade' : 'unidades'}
                  </span>
                </div>
                <span className="mt-6 inline-flex items-center justify-center rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold text-white transition group-hover:bg-navy-700">
                  Ver detalhes do plano
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="px-6 py-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-navy-900 p-10 text-center text-white md:p-12">
          <HeartPulse className="absolute -right-6 -top-6 h-40 w-40 text-mint-400/20 float-slow" />
          <h2 className="text-2xl font-bold md:text-3xl">Pronto para transformar sua clínica?</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-85">Agende uma demonstração gratuita e descubra como o ClinicOS pode simplificar sua rotina em poucos dias.</p>
          <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
            <input type="email" required placeholder="Seu melhor e-mail" className="flex-1 rounded-full bg-white px-5 py-3.5 text-ink-900 outline-none" />
            <button className="rounded-full bg-mint-400 px-7 py-3.5 font-semibold text-navy-900 hover:opacity-90">Quero conhecer</button>
          </form>
        </div>
      </section>

      <a
        href="https://wa.me/5527997139806?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20uma%20consulta."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Agende sua consulta pelo WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-mint-400 px-5 py-3 font-semibold text-navy-900 shadow-lg transition hover:opacity-90"
      >
        <MessageCircle className="h-4 w-4" />
        Agende sua consulta
      </a>

      <footer className="border-t border-line py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-ink-500 md:flex-row">
          <p className="text-lg font-bold text-navy-900">Clinic<span className="text-mint-400">OS</span></p>
          <p>© 2026 ClinicOS. Tecnologia que cuida de quem cuida.</p>
        </div>
      </footer>
    </div>
  );
}
