import { create } from 'zustand';
import { listAchievements, unlockAchievement } from '@/database/repositories/achievements';
import { ACHIEVEMENTS } from '@/services/achievements';
import type { AchievementDef, AchievementState } from '@/utils/types';

interface State {
  definitions: AchievementDef[];
  byId: Record<string, AchievementState>;
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  unlock: (id: string) => Promise<void>;
}

export const useAchievementsStore = create<State>(set => ({
  definitions: ACHIEVEMENTS,
  byId: {},
  loaded: false,
  loadFromDb: async () => {
    const rows = await listAchievements();
    const byId: Record<string, AchievementState> = {};
    for (const r of rows) byId[r.id] = r;
    set({ byId, loaded: true });
  },
  unlock: async id => {
    await unlockAchievement(id);
    set(s => ({
      byId: { ...s.byId, [id]: { id, unlocked: true, unlocked_at: new Date().toISOString() } },
    }));
  },
}));
