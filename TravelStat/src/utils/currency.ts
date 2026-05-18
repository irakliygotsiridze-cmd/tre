export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'IDR', 'MYR', 'BRL', 'MXN'] as const;
export type CurrencyCode = typeof CURRENCIES[number];

const SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', IDR: 'Rp', MYR: 'RM', BRL: 'R$', MXN: 'MX$',
};

export function symbol(code: string): string {
  return (SYMBOLS as Record<string, string>)[code] ?? code + ' ';
}

export function fmtMoney(amount: number, code: string): string {
  const sym = symbol(code);
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  let formatted: string;
  if (abs >= 1000) {
    formatted = Math.round(abs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } else {
    formatted = Math.round(abs).toString();
  }
  return `${sign}${sym}${formatted}`;
}

export function averagePerDay(budget: number, days: number): number {
  if (days <= 0) return 0;
  return budget / days;
}
