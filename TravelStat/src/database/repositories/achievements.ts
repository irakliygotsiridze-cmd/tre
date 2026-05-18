import { getDb } from '../client';
import type { AchievementState } from '@/utils/types';

export async function listAchievements(): Promise<AchievementState[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; unlocked: number; unlocked_at: string | null }>(
    `SELECT * FROM achievements;`,
  );
  return rows.map(r => ({ id: r.id, unlocked: r.unlocked === 1, unlocked_at: r.unlocked_at }));
}

export async function unlockAchievement(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE achievements SET unlocked=1, unlocked_at=? WHERE id=? AND unlocked=0;`,
    new Date().toISOString(),
    id,
  );
}
