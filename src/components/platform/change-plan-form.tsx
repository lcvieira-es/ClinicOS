'use client';

import { useActionState } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import {
  changeSubscriptionPlanAction,
  generateInvoiceAction,
  type SimpleState,
} from '@/lib/platform/actions';
import { Button } from '@/components/ui/button';

export interface PlanOption {
  id: string;
  name: string;
  slug: string;
}

export function ChangePlanForm({
  clinicId,
  plans,
  currentPlanId,
  currentPeriodicity,
}: {
  clinicId: string;
  plans: PlanOption[];
  currentPlanId?: string;
  currentPeriodicity?: string;
}) {
  const [state, formAction, pending] = useActionState<SimpleState, FormData>(
    changeSubscriptionPlanAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="clinicId" value={clinicId} />
      <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
        <select
          name="planId"
          defaultValue={currentPlanId}
          className="h-10 w-full appearance-none rounded-xl border border-[#737373] bg-white px-3 text-sm outline-none transition focus:border-navy-600"
          aria-label="Novo plano"
          required
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
        <select
          name="periodicity"
          defaultValue={currentPeriodicity ?? 'mensal'}
          className="h-10 w-full appearance-none rounded-xl border border-[#737373] bg-white px-3 text-sm capitalize outline-none transition focus:border-navy-600"
          aria-label="Periodicidade"
        >
          <option value="mensal">Mensal</option>
          <option value="anual">Anual</option>
        </select>
      </div>
      {state.error ? (
        <p className="text-xs font-medium text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-xs font-medium text-success" role="status">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending} className="w-full">
        {pending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
            Alterando…
          </>
        ) : (
          <>
            Alterar plano e recalcular módulos
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </>
        )}
      </Button>
    </form>
  );
}

export function GenerateInvoiceButton({ clinicId }: { clinicId: string }) {
  const [state, formAction, pending] = useActionState<SimpleState, FormData>(
    generateInvoiceAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="clinicId" value={clinicId} />
      {state.error ? (
        <p className="text-xs font-medium text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-xs font-medium text-success" role="status">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" size="sm" disabled={pending} className="w-full">
        {pending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
            Gerando…
          </>
        ) : (
          'Gerar fatura do período'
        )}
      </Button>
    </form>
  );
}
