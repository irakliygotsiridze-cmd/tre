import { getDb } from '../client';
import type { CityId } from '@/utils/types';

export interface CityRow {
  id: CityId;
  visited: number;
  wishlist: number;
  visited_at: string | null;
}

export async function listCities(): Promise<CityRow[]> {
  const db = await getDb();
  return db.getAllAsync<CityRow>(`SELECT * FROM cities;`);
}

export async function setCityVisited(id: CityId, visited: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE cities SET visited=?, visited_at=? WHERE id=?;`,
    visited ? 1 : 0,
    visited ? new Date().toISOString() : null,
    id,
  );
}

export async function setCityWishlist(id: CityId, wishlist: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE cities SET wishlist=? WHERE id=?;`,
    wishlist ? 1 : 0,
    id,
  );
}
