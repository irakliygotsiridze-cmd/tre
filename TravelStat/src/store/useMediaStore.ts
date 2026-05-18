import { create } from 'zustand';
import { listMedia, insertMedia, deleteMediaRow } from '@/database/repositories/media';
import type { Media, CityId, MediaType } from '@/utils/types';

interface State {
  byCity: Map<CityId, Media[]>;
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  addMedia: (cityId: CityId, filePath: string, type: MediaType) => Promise<Media>;
  deleteMedia: (id: number) => Promise<void>;
}

function group(rows: Media[]): Map<CityId, Media[]> {
  const m = new Map<CityId, Media[]>();
  for (const r of rows) {
    const arr = m.get(r.city_id) ?? [];
    arr.push(r);
    m.set(r.city_id, arr);
  }
  return m;
}

export const useMediaStore = create<State>((set) => ({
  byCity: new Map(),
  loaded: false,
  loadFromDb: async () => set({ byCity: group(await listMedia()), loaded: true }),
  addMedia: async (cityId, filePath, type) => {
    const id = await insertMedia(cityId, filePath, type);
    const m: Media = { id, city_id: cityId, file_path: filePath, type, created_at: new Date().toISOString() };
    set(s => {
      const next = new Map(s.byCity);
      next.set(cityId, [m, ...(next.get(cityId) ?? [])]);
      return { byCity: next };
    });
    return m;
  },
  deleteMedia: async id => {
    await deleteMediaRow(id);
    set(s => {
      const next = new Map<CityId, Media[]>();
      for (const [cid, arr] of s.byCity) {
        const filtered = arr.filter(m => m.id !== id);
        if (filtered.length) next.set(cid, filtered);
      }
      return { byCity: next };
    });
  },
}));
