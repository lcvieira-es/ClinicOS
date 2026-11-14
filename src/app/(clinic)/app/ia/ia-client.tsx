'use client';

import { useActionState } from 'react';
import { LoaderCircle, Sparkles, Send } from 'lucide-react';
import { askAiAction } from '@/lib/clinic/actions/ia';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';

export default function IaPageClient() {
  const [state, formAction, pending] = useActionState(askAiAction, {});

  return (
    <div className="animate-fade space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
          Assistente de IA
        </h1>
        <p className="mt-1 text-xs text-ink-500">
          Apoio à documentação e organização clínica, com revisão humana obrigatória.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Nova solicitação"
          description="A IA não diagnostica, não prescreve e não finaliza documentos."
        />
        <CardBody>
          <form action={formAction} className="space-y-4">
            {state.error ? (
              <div className="rounded-xl border border-red-200 bg-danger-soft/60 px-4 py-3 text-xs font-medium text-red-700" role="alert">
                {state.error}
              </div>
            ) : null}
            <Field label="Sua solicitação" htmlFor="prompt">
              <Input
                id="prompt"
                name="prompt"
                placeholder="Ex.: resuma a anamnese para revisão…"
                required
              />
            </Field>
            <div className="flex items-center justify-end">
              <Button type="submit" disabled={pending} size="md">
                {pending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
                    Processando…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" strokeWidth={2} />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {state.response ? (
        <Card>
          <CardHeader
            title="Resposta"
            description={`Status: ${state.status ?? 'concluida'}`}
          />
          <CardBody>
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-navy-800">
                <Sparkles className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <p className="text-xs leading-relaxed text-ink-700">{state.response}</p>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-ink-400">
              Toda informação clínica deve ser validada por um profissional de
              saúde antes de ser finalizada. A IA não assina nem finaliza
              documentos.
            </p>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
