const BR_TIME_ZONE = 'America/Sao_Paulo';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: BR_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: BR_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: BR_TIME_ZONE,
});

/**
 * Converte o valor vindo do banco em um `Date` correto.
 *
 * - Datas puras (`YYYY-MM-DD`) chegam como texto e o JS as interpreta como
 *   UTC, o que as exibiria um dia antes no fuso de São Paulo. Ancoramos ao
 *   meio-dia de Brasília para preservar o dia calendário.
 * - O Postgres renderiza o fuso como `-03`, `-03:00`, `+00` ou `Z`; o JS só
 *   aceita `Z` ou offsets no formato `±HH:MM`, então normalizamos.
 * - Timestamps sem fuso são tratados como horário de Brasília.
 */
export function parseDateValue(value: string | Date): Date {
  if (value instanceof Date) return value;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T12:00:00-03:00`);
  }
  if (/^\d{4}-\d{2}-\d{2} 00:00:00$/.test(raw)) {
    return new Date(`${raw.slice(0, 10)}T12:00:00-03:00`);
  }
  let iso = raw.replace(' ', 'T');
  if (/[+-]\d{2}$/.test(iso)) iso = `${iso}:00`;
  else if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(iso)) iso = `${iso}-03:00`;
  return new Date(iso.replace(/\+00:00$/, 'Z'));
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateTimeFormatter.format(date);
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) return '—';
  return timeFormatter.format(date);
}

/** Data calendário (`YYYY-MM-DD`) no fuso de Brasília, para agrupar/diagnosticar. */
export function isoDateOf(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: BR_TIME_ZONE }).format(date);
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return currencyFormatter.format(0);
  const number = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(number)) return currencyFormatter.format(0);
  return currencyFormatter.format(number);
}

export function formatNumber(value: number | string | null | undefined): string {
  const number = typeof value === 'string' ? Number(value) : (value ?? 0);
  if (Number.isNaN(number)) return '0';
  return numberFormatter.format(number);
}

export function formatPercent(value: number | string | null | undefined, digits = 1): string {
  const number = typeof value === 'string' ? Number(value) : (value ?? 0);
  if (Number.isNaN(number)) return '0%';
  return `${number.toFixed(digits).replace('.', ',')}%`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function firstName(name: string | null | undefined): string {
  if (!name) return '';
  return name.trim().split(/\s+/)[0] ?? '';
}

export function todayLabel(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: BR_TIME_ZONE,
  }).format(new Date());
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
