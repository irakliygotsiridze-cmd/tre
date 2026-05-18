import { countriesPerContinent, costPerCountry } from './stats';
import type { CountryMeta, Visit } from '@/utils/types';

const byCode: Record<string, CountryMeta> = {
  MX: { iso_code: 'MX', name: 'Mexico', continent: 'North America', flag: '🇲🇽' },
  JP: { iso_code: 'JP', name: 'Japan', continent: 'Asia', flag: '🇯🇵' },
  CN: { iso_code: 'CN', name: 'China', continent: 'Asia', flag: '🇨🇳' },
};

test('countriesPerContinent aggregates and sorts', () => {
  const out = countriesPerContinent(new Set(['MX', 'JP', 'CN']), byCode);
  expect(out).toEqual([
    { continent: 'Asia', count: 2 },
    { continent: 'North America', count: 1 },
  ]);
});

test('costPerCountry only sums same-currency budgets', () => {
  const v: Visit[] = [
    { id: 1, country_code: 'MX', city_id: null, start_date: '2026-01-01', end_date: '2026-01-10', notes: null, budget: 1400, budget_currency: 'USD' },
    { id: 2, country_code: 'JP', city_id: null, start_date: '2026-02-01', end_date: '2026-02-12', notes: null, budget: 280000, budget_currency: 'JPY' },
  ];
  const out = costPerCountry(v, 'USD');
  expect(out[0].iso).toBe('MX');
  expect(out[0].perDay).toBeCloseTo(140);
  const jp = out.find(x => x.iso === 'JP');
  expect(jp?.totalBudget).toBe(0);
  expect(jp?.currency).toBe(null);
});
