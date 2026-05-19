import { create } from 'zustand';
import { listVisitCities, insertVisitCities, deleteVisitCitiesForVisit } from '@/database/repositories/visitCities';
import type { VisitCity, NewVisitCity } from '@/utils/types';

interface State {
  byVisit: Map<number, VisitCity[]>;
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  setForVisit: (visitId: number, cities: NewVisitCity[]) => Promise<void>;
  clearForVisit: (visitId: number) => Promise<void>;
}

function group(rows: VisitCity[]): Map<number, VisitCity[]> {
  const m = new Map<number, VisitCity[]>();
  for (const r of rows) {
    const arr = m.get(r.visit_id) ?? [];
    arr.push(r);
    m.set(r.visit_id, arr);
  }
  // ensure each list is sorted by order_index
  for (const arr of m.values()) arr.sort((a, b) => a.order_index - b.order_index);
  return m;
}

export const useVisitCitiesStore = create<State>((set, get) => ({
  byVisit: new Map(),
  loaded: false,
  loadFromDb: async () => set({ byVisit: group(await listVisitCities()), loaded: true }),
  setForVisit: async (visitId, cities) => {
    await deleteVisitCitiesForVisit(visitId);
    await insertVisitCities(visitId, cities);
    // reload from DB to get IDs assigned
    set({ byVisit: group(await listVisitCities()) });
  },
  clearForVisit: async visitId => {
    await deleteVisitCitiesForVisit(visitId);
    set(s => {
      const next = new Map(s.byVisit);
      next.delete(visitId);
      return { byVisit: next };
    });
  },
}));
