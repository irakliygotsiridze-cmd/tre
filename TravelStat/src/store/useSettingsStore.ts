import { create } from 'zustand';
import { getMeta, setMeta } from '@/database/repositories/meta';

interface State {
  baseCurrency: string;
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  setBaseCurrency: (code: string) => Promise<void>;
}

export const useSettingsStore = create<State>(set => ({
  baseCurrency: 'USD',
  loaded: false,
  loadFromDb: async () => {
    const v = await getMeta('base_currency');
    set({ baseCurrency: v ?? 'USD', loaded: true });
  },
  setBaseCurrency: async code => {
    await setMeta('base_currency', code);
    set({ baseCurrency: code });
  },
}));
