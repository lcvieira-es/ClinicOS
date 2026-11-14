/**
 * Formata CNPJ para exibição amigável: 00.000.000/0000-00.
 * Valores inválidos são exibidos sem máscara (falha transparente).
 */
export function formatCnpj(value: string | null | undefined): string {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14) return value;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/** Formata CPF: 000.000.000-00. */
export function formatCpf(value: string | null | undefined): string {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return value;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}
