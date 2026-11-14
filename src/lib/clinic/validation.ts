/** Erro de negócio: a mensagem é segura para exibir na UI. */
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionError';
  }
}

/** Converte qualquer exceção em uma mensagem utilizável pelo formulário. */
export function errorMessage(error: unknown): string {
  if (error instanceof ActionError) return error.message;

  const message = error instanceof Error ? error.message : String(error);
  if (/duplicate key|unique constraint/i.test(message)) {
    return 'Já existe um registro com esses dados nesta clínica.';
  }
  if (/row-level security|violates row-level/i.test(message)) {
    return 'Seu perfil não tem permissão para esta operação.';
  }
  if (/foreign key|violates foreign key/i.test(message)) {
    return 'Não é possível excluir: o registro está vinculado a outros dados.';
  }
  if (/value is not valid for type|invalid input syntax/i.test(message)) {
    return 'Um dos valores enviados é inválido. Revise os campos.';
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}

/** Remove tudo que não for dígito (CPF, telefone, CEP). */
export function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): boolean {
  return Boolean(value && UUID_PATTERN.test(value));
}

/** Normaliza CPF para os 11 dígitos; retorna `null` quando vazio/inválido. */
export function normalizeCpf(value: string | null | undefined): {
  cpf: string | null;
  invalid: boolean;
} {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return { cpf: null, invalid: false };
  const digits = digitsOnly(trimmed);
  if (digits.length !== 11) return { cpf: null, invalid: true };
  return { cpf: digits, invalid: false };
}

/** Texto `YYYY-MM-DD` aceito por inputs `type="date"`. */
export function isoDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * `redirect()`/`notFound()` do Next.js abortam por exceção com `digest`
 * interno. Nunca devemos engolir esses erros ao capturar exceções de ações.
 */
export function isRedirectError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const digest = (error as { digest?: unknown }).digest;
  return (
    typeof digest === 'string' &&
    (digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_NOT_FOUND'))
  );
}
