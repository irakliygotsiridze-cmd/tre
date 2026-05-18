import { create } from 'zustand';
import citiesJson from '../../assets/data/cities.json';
import { listCities, setCityVisited } from '@/database/repositories/cities';
import type { City, CityId } from '@/utils/types';

interface State {
  all: City[];
  byId: Map<CityId, City>;
  visited: Set<CityId>;
  withMedia: Set<CityId>;
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  toggleVisited: (id: CityId) => Promise<void>;
  setWithMedia: (ids: Set<CityId>) => void;
}

const all = citiesJson as City[];
const byId = new Map(all.map(c => [c.id, c]));

export const useCitiesStore = create<State>((set, get) => ({
  all,
  byId,
  visited: new Set(),
  withMedia: new Set(),
  loaded: false,
  loadFromDb: async () => {
    const rows = await listCities();
    set({
      visited: new Set(rows.filter(r => r.visited === 1).map(r => r.id)),
      loaded: true,
    });
  },
  toggleVisited: async id => {
    const isV = get().visited.has(id);
    await setCityVisited(id, !isV);
    set(s => {
      const next = new Set(s.visited);
      if (isV) next.delete(id); else next.add(id);
      return { visited: next };
    });
  },
  setWithMedia: ids => set({ withMedia: ids }),
}));
