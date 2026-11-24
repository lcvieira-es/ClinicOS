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

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(typeof value === 'string' ? value.replace(' ', 'T').replace('+00', 'Z') : value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(typeof value === 'string' ? value.replace(' ', 'T').replace('+00', 'Z') : value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateTimeFormatter.format(date);
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(typeof value === 'string' ? value.replace(' ', 'T').replace('+00', 'Z') : value);
  if (Number.isNaN(date.getTime())) return '—';
  return timeFormatter.format(date);
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
