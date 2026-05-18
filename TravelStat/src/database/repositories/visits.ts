import { getDb } from '../client';
import type { Visit, NewVisit } from '@/utils/types';

export async function listVisits(): Promise<Visit[]> {
  const db = await getDb();
  return db.getAllAsync<Visit>(
    `SELECT * FROM visits ORDER BY start_date DESC, id DESC;`,
  );
}

export async function insertVisit(v: NewVisit): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    `INSERT INTO visits (country_code,city_id,start_date,end_date,notes,budget,budget_currency)
     VALUES (?,?,?,?,?,?,?);`,
    v.country_code,
    v.city_id ?? null,
    v.start_date,
    v.end_date ?? null,
    v.notes ?? null,
    v.budget ?? null,
    v.budget_currency ?? null,
  );
  return res.lastInsertRowId as number;
}

export async function deleteVisit(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM visits WHERE id=?;`, id);
}
