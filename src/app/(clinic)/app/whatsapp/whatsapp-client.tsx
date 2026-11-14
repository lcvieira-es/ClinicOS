'use client';

import { useActionState } from 'react';
import { LoaderCircle, Send, MessageCircle } from 'lucide-react';
import { sendWhatsappAction } from '@/lib/clinic/actions/whatsapp';
import { listWhatsappMessages, listWhatsappPatients } from '@/lib/clinic/whatsapp';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/format';

interface Message {
  id: string;
  patient_id: string | null;
  patient_name: string | null;
  direction: string;
  template: string | null;
  content: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

interface Patient {
  id: string;
  name: string;
  phone: string | null;
}

export default function WhatsappPageClient({
  messages,
  patients,
}: {
  messages: Message[];
  patients: Patient[];
}) {
  const [state, formAction, pending] = useActionState(sendWhatsappAction, {});

  return (
    <div className="animate-fade space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
          WhatsApp
        </h1>
        <p className="mt-1 text-xs text-ink-500">
          Lembretes e mensagens manuais vinculadas à agenda.
        </p>
      </div>

      <Card>
        <CardHeader title="Nova mensagem" description="Registra e gera link para envio pelo WhatsApp." />
        <CardBody>
          <form action={formAction} className="space-y-4">
            {state.error ? (
              <div className="rounded-xl border border-red-200 bg-danger-soft/60 px-4 py-3 text-xs font-medium text-red-700" role="alert">
                {state.error}
              </div>
            ) : null}
            {state.success ? (
              <div className="rounded-xl border border-emerald-200 bg-success-soft/60 px-4 py-3 text-xs font-medium text-emerald-700" role="status">
                {state.success}
              </div>
            ) : null}
            {state.waLink ? (
              <a
                href={state.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir no WhatsApp
              </a>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Paciente" htmlFor="patientId">
                <Select id="patientId" name="patientId" defaultValue="">
                  <option value="">—</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Telefone (com DDD)" htmlFor="phone">
                <Input id="phone" name="phone" inputMode="tel" placeholder="11999990000" />
              </Field>
              <Field label="Template" htmlFor="template">
                <Input id="template" name="template" placeholder="lembrete_consulta" />
              </Field>
              <Field label="Conteúdo *" htmlFor="content" className="sm:col-span-2">
                <Input id="content" name="content" required placeholder="Olá! Lembrete da sua consulta…" />
              </Field>
            </div>
            <div className="flex items-center justify-end">
              <Button type="submit" disabled={pending} size="md">
                {pending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
                    Registrando…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" strokeWidth={2} />
                    Registrar mensagem
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Histórico" description={`${messages.length} mensagem(ns)`} />
        <CardBody className="p-0">
          {messages.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="Nenhuma mensagem registrada"
              description="Registre a primeira mensagem."
              className="py-8"
            />
          ) : (
            <div className="divide-y divide-line">
              {messages.map((message) => (
                <div key={message.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-ink-900">
                      {message.patient_name ?? 'Sem paciente'}
                    </p>
                    <StatusBadge status={message.status} />
                  </div>
                  <p className="mt-1 text-xs text-ink-700">{message.content}</p>
                  <p className="mt-1 text-[10px] text-ink-400">
                    {formatDateTime(message.created_at)}
                    {message.template ? ` · template ${message.template}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
