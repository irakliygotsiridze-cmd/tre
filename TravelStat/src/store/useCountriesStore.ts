import { create } from 'zustand';
import countriesJson from '../../assets/data/countries.json';
import countriesGeoJson from '../../assets/data/countries.geojson';
import { listCountries, setCountryVisited, setCountryWishlist } from '@/database/repositories/countries';
import type { CountryMeta, IsoCode } from '@/utils/types';

interface State {
  byCode: Record<IsoCode, CountryMeta>;
  geojson: any;
  visited: Set<IsoCode>;
  wishlist: Set<IsoCode>;
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  toggleVisited: (iso: IsoCode) => Promise<void>;
  toggleWishlist: (iso: IsoCode) => Promise<void>;
}

const initialByCode: Record<IsoCode, CountryMeta> = Object.fromEntries(
  (countriesJson as CountryMeta[]).map(c => [c.iso_code, c]),
);

export const useCountriesStore = create<State>((set, get) => ({
  byCode: initialByCode,
  geojson: countriesGeoJson,
  visited: new Set(),
  wishlist: new Set(),
  loaded: false,
  loadFromDb: async () => {
    const rows = await listCountries();
    set({
      visited: new Set(rows.filter(r => r.visited === 1).map(r => r.iso_code)),
      wishlist: new Set(rows.filter(r => r.wishlist === 1).map(r => r.iso_code)),
      loaded: true,
    });
  },
  toggleVisited: async iso => {
    const isV = get().visited.has(iso);
    await setCountryVisited(iso, !isV);
    set(s => {
      const next = new Set(s.visited);
      if (isV) next.delete(iso); else next.add(iso);
      return { visited: next };
    });
  },
  toggleWishlist: async iso => {
    const isW = get().wishlist.has(iso);
    await setCountryWishlist(iso, !isW);
    set(s => {
      const next = new Set(s.wishlist);
      if (isW) next.delete(iso); else next.add(iso);
      return { wishlist: next };
    });
  },
}));
