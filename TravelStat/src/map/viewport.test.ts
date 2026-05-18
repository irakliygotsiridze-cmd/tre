import { visibleCities, regionToBbox, inBbox } from './viewport';
import type { City } from '@/utils/types';

const mk = (id: number, lat: number, lng: number, pop = 1_000_000): City => ({
  id, lat, lng, name: `c${id}`, country: 'XX', population: pop,
});

test('hides all cities when latitudeDelta >= 30', () => {
  const r = { latitude: 0, longitude: 0, latitudeDelta: 30, longitudeDelta: 30 };
  expect(visibleCities([mk(1, 0, 0)], r, new Set(), new Set())).toEqual([]);
});

test('caps at 300 markers, ranking visited first', () => {
  const cities: City[] = [];
  for (let i = 0; i < 500; i++) cities.push(mk(i, 0, 0, 1_000_000 - i));
  const visited = new Set<number>([499]);
  const r = { latitude: 0, longitude: 0, latitudeDelta: 1, longitudeDelta: 1 };
  const out = visibleCities(cities, r, visited, new Set());
  expect(out).toHaveLength(300);
  expect(out[0].id).toBe(499);
});

test('bbox filters out points outside region', () => {
  const r = { latitude: 0, longitude: 0, latitudeDelta: 10, longitudeDelta: 10 };
  const b = regionToBbox(r);
  expect(inBbox({ lat: 4, lng: 4 }, b)).toBe(true);
  expect(inBbox({ lat: 6, lng: 0 }, b)).toBe(false);
});
