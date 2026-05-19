import { getDb } from '../client';
import type { TransportMode, VisitCity, NewVisitCity } from '@/utils/types';

export async function listVisitCities(): Promise<VisitCity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    visit_id: number;
    city_id: number;
    order_index: number;
    transport: string | null;
  }>(`SELECT * FROM visit_cities ORDER BY visit_id, order_index;`);
  return rows.map(r => ({
    id: r.id,
    visit_id: r.visit_id,
    city_id: r.city_id,
    order_index: r.order_index,
    transport: r.transport as TransportMode | null,
  }));
}

export async function insertVisitCities(visitId: number, cities: NewVisitCity[]): Promise<void> {
  if (!cities.length) return;
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < cities.length; i++) {
      const c = cities[i];
      await db.runAsync(
        `INSERT INTO visit_cities (visit_id, city_id, order_index, transport) VALUES (?,?,?,?);`,
        visitId, c.city_id, i, c.transport ?? null,
      );
    }
  });
}

export async function deleteVisitCitiesForVisit(visitId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM visit_cities WHERE visit_id=?;`, visitId);
}
