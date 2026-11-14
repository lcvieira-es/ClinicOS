'use client';

import { useActionState } from 'react';
import { CircleCheck, LoaderCircle } from 'lucide-react';
import { registerPaymentAction, type SimpleState } from '@/lib/platform/actions';

export function RegisterPaymentButton({
  invoiceId,
  compact = false,
}: {
  invoiceId: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState<SimpleState, FormData>(
    registerPaymentAction,
    {},
  );

  if (state.success) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
        <CircleCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
        Pagamento registrado
      </span>
    );
  }

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      {state.error ? (
        <span className="mb-1 block text-[10px] font-medium text-danger">
          {state.error}
        </span>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        onClick={(event) => {
          if (!window.confirm('Registrar o pagamento desta fatura?')) {
            event.preventDefault();
          }
        }}
        className={
          compact
            ? 'inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 transition hover:text-emerald-900 disabled:opacity-60'
            : 'inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60'
        }
      >
        {pending ? (
          <>
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
            Registrando…
          </>
        ) : (
          'Registrar pagamento'
        )}
      </button>
    </form>
  );
}
