import type { CountryMeta, IsoCode, Visit } from '@/utils/types';
import { visitDays } from '@/utils/dates';

export interface PerContinent { continent: string; count: number; }

export function countriesPerContinent(
  visited: Set<IsoCode>,
  byCode: Record<IsoCode, CountryMeta>,
): PerContinent[] {
  const counts: Record<string, number> = {};
  for (const iso of visited) {
    const c = byCode[iso];
    if (!c) continue;
    counts[c.continent] = (counts[c.continent] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([continent, count]) => ({ continent, count }))
    .sort((a, b) => b.count - a.count);
}

export interface CountryCost {
  iso: IsoCode;
  days: number;
  totalBudget: number;
  currency: string | null;
  perDay: number;
}

export function costPerCountry(visits: Visit[], baseCurrency: string): CountryCost[] {
  const byIso: Record<IsoCode, { days: number; totalBudget: number; currency: string | null }> = {};
  for (const v of visits) {
    const k = v.country_code;
    if (!byIso[k]) byIso[k] = { days: 0, totalBudget: 0, currency: null };
    byIso[k].days += visitDays(v.start_date, v.end_date);
    if (v.budget != null && v.budget_currency === baseCurrency) {
      byIso[k].totalBudget += v.budget;
      byIso[k].currency = baseCurrency;
    }
  }
  return Object.entries(byIso)
    .map(([iso, x]) => ({
      iso,
      days: x.days,
      totalBudget: x.totalBudget,
      currency: x.currency,
      perDay: x.days > 0 && x.totalBudget > 0 ? x.totalBudget / x.days : 0,
    }))
    .sort((a, b) => b.perDay - a.perDay);
}
