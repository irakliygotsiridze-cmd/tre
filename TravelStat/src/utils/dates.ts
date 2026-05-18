import { differenceInCalendarDays, format, parseISO } from 'date-fns';

export function visitDays(start: string, end: string | null): number {
  if (!end) return 1;
  return Math.max(1, differenceInCalendarDays(parseISO(end), parseISO(start)) + 1);
}

export function fmtDate(iso: string): string {
  return format(parseISO(iso), 'PP');
}

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
