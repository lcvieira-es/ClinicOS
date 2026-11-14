import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getInviteStatus } from '@/lib/clinic/actions/invite-accept';
import { acceptInviteAction } from '@/lib/clinic/actions/invite-accept';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

export const metadata = { title: 'Aceitar convite' };

export default async function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const status = await getInviteStatus(token);

  if (!status.found) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sky-25 px-4">
        <Card className="w-full max-w-md">
          <CardBody className="space-y-3 text-center">
            <h1 className="text-lg font-bold text-navy-900">Convite inválido</h1>
            <p className="text-xs text-ink-500">
              Este link de convite não existe ou foi removido.
            </p>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-navy-900 px-4 text-xs font-semibold text-white transition hover:bg-navy-800"
            >
              Ir para o login
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  if (!status.valid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sky-25 px-4">
        <Card className="w-full max-w-md">
          <CardBody className="space-y-3 text-center">
            <h1 className="text-lg font-bold text-navy-900">Convite indisponível</h1>
            <p className="text-xs text-ink-500">
              Este convite já foi utilizado ou expirou. Solicite um novo convite
              ao administrador da clínica.
            </p>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-navy-900 px-4 text-xs font-semibold text-white transition hover:bg-navy-800"
            >
              Ir para o login
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-25 px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <PageHeader
          eyebrow="ClinicOS"
          title="Aceitar convite"
          description={`Você foi convidado como ${status.email}. Defina seu nome e senha para acessar.`}
        />

        {sp.erro ? (
          <Alert variant="danger">{decodeURIComponent(sp.erro)}</Alert>
        ) : null}
        {sp.msg ? (
          <Alert variant="success">{decodeURIComponent(sp.msg)}</Alert>
        ) : null}

        <Card>
          <CardBody>
            <form action={acceptInviteAction} className="space-y-4">
              <input type="hidden" name="token" value={token} />
              <Field label="Nome completo *" htmlFor="fullName">
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  minLength={3}
                  defaultValue={status.fullName ?? ''}
                  placeholder="Seu nome completo"
                />
              </Field>
              <Field label="Senha *" htmlFor="password">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                />
              </Field>
              <Field label="Confirmar senha *" htmlFor="confirm">
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  minLength={8}
                />
              </Field>
              <p className="text-[10px] leading-relaxed text-ink-400">
                Se você já possui uma conta no ClinicOS, use a mesma senha atual —
                o convite apenas vincula seu acesso à clínica.
              </p>
              <Button type="submit" size="md" className="w-full">
                <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                Aceitar convite
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="text-center text-[11px] text-ink-400">
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold text-navy-800 hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </main>
  );
}
