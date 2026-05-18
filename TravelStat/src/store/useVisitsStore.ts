import { create } from 'zustand';
import { listVisits, insertVisit, deleteVisit as repoDelete } from '@/database/repositories/visits';
import type { Visit, NewVisit } from '@/utils/types';

interface State {
  visits: Visit[];
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  addVisit: (v: NewVisit) => Promise<Visit>;
  deleteVisit: (id: number) => Promise<void>;
}

export const useVisitsStore = create<State>((set, get) => ({
  visits: [],
  loaded: false,
  loadFromDb: async () => set({ visits: await listVisits(), loaded: true }),
  addVisit: async input => {
    const id = await insertVisit(input);
    const visit: Visit = {
      id,
      country_code: input.country_code,
      city_id: input.city_id ?? null,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      notes: input.notes ?? null,
      budget: input.budget ?? null,
      budget_currency: input.budget_currency ?? null,
    };
    set(s => ({ visits: [visit, ...s.visits] }));
    return visit;
  },
  deleteVisit: async id => {
    await repoDelete(id);
    set(s => ({ visits: s.visits.filter(v => v.id !== id) }));
  },
}));
