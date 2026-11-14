'use client';

import { useActionState } from 'react';
import { LoaderCircle, Plus } from 'lucide-react';
import { addClinicModuleAction, type SimpleState } from '@/lib/platform/actions';
import { Button } from '@/components/ui/button';

export function AddModuleForm({
  clinicId,
  modules,
}: {
  clinicId: string;
  modules: Array<{ id: string; name: string; category: string }>;
}) {
  const [state, formAction, pending] = useActionState<SimpleState, FormData>(
    addClinicModuleAction,
    {},
  );

  if (modules.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line px-3 py-2.5 text-[10px] leading-relaxed text-ink-400">
        Todos os módulos ativos já estão contratados para esta clínica.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="clinicId" value={clinicId} />
      <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
        <select
          name="moduleId"
          className="h-10 w-full appearance-none rounded-xl border border-[#737373] bg-white px-3 text-xs outline-none transition focus:border-navy-600"
          aria-label="Módulo adicional"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Selecione…
          </option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.name}
            </option>
          ))}
        </select>
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          placeholder="R$ 0,00"
          className="h-10 w-full rounded-xl border border-[#737373] px-3 text-xs outline-none transition focus:border-navy-600"
          aria-label="Preço mensal do módulo adicional"
          required
        />
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
      <Button type="submit" variant="secondary" size="sm" disabled={pending} className="w-full">
        {pending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
            Ativando…
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Ativar módulo adicional
          </>
        )}
      </Button>
    </form>
  );
}
