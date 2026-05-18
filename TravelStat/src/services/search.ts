import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import type { CountryMeta, City } from '@/utils/types';

export type SearchResult =
  | { kind: 'country'; item: CountryMeta }
  | { kind: 'city';    item: City };

export function search(query: string, limit = 20): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const out: SearchResult[] = [];
  const countries = Object.values(useCountriesStore.getState().byCode) as CountryMeta[];
  for (const c of countries) {
    if (c.name.toLowerCase().includes(q)) out.push({ kind: 'country', item: c });
    if (out.length >= limit) return rank(out, q);
  }

  const cities = useCitiesStore.getState().all;
  for (const c of cities) {
    if (c.name.toLowerCase().includes(q)) out.push({ kind: 'city', item: c });
    if (out.length >= limit) break;
  }
  return rank(out, q);
}

function rank(items: SearchResult[], q: string): SearchResult[] {
  return items
    .map(r => {
      const name = (r.kind === 'country' ? r.item.name : r.item.name).toLowerCase();
      const score = name === q ? 0 : name.startsWith(q) ? 1 : 2;
      return { r, score };
    })
    .sort((a, b) => a.score - b.score)
    .map(x => x.r);
}
