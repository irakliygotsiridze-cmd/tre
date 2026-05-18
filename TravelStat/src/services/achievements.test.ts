import { buildSnapshot, newlyUnlocked } from './achievements';
import type { CountryMeta } from '@/utils/types';

const byCode: Record<string, CountryMeta> = {
  MX: { iso_code: 'MX', name: 'Mexico', continent: 'North America', flag: '🇲🇽' },
  JP: { iso_code: 'JP', name: 'Japan',  continent: 'Asia',          flag: '🇯🇵' },
};

test('first_flight unlocks at 1 country', () => {
  const snap = buildSnapshot({ countriesVisited: new Set(['MX']), citiesVisited: new Set(), byCode });
  const out = newlyUnlocked(snap, {});
  expect(out).toContain('first_flight');
});

test('does not re-unlock already unlocked', () => {
  const snap = buildSnapshot({ countriesVisited: new Set(['MX']), citiesVisited: new Set(), byCode });
  const out = newlyUnlocked(snap, { first_flight: { unlocked: true } });
  expect(out).not.toContain('first_flight');
});

test('continental_traveler needs 5 distinct continents', () => {
  const snap = buildSnapshot({ countriesVisited: new Set(['MX', 'JP']), citiesVisited: new Set(), byCode });
  expect(newlyUnlocked(snap, {})).not.toContain('continental_traveler');
});
