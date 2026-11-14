/** Estado compartilhado dos formulários com `useActionState`. */
export interface ClinicFormState {
  error?: string;
  success?: string;
  /** Identificador do registro criado (permite redirecionar na UI). */
  id?: string;
}

export const emptyFormState: ClinicFormState = {};
