import { getDb } from '../client';
import type { IsoCode } from '@/utils/types';

export interface CountryRow {
  iso_code: IsoCode;
  visited: number;
  wishlist: number;
  visited_at: string | null;
}

export async function listCountries(): Promise<CountryRow[]> {
  const db = await getDb();
  return db.getAllAsync<CountryRow>(`SELECT * FROM countries;`);
}

export async function setCountryVisited(iso: IsoCode, visited: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE countries SET visited=?, visited_at=? WHERE iso_code=?;`,
    visited ? 1 : 0,
    visited ? new Date().toISOString() : null,
    iso,
  );
}

export async function setCountryWishlist(iso: IsoCode, wishlist: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE countries SET wishlist=? WHERE iso_code=?;`,
    wishlist ? 1 : 0,
    iso,
  );
}
