import { getDb } from '../client';
import type { Media, MediaType, CityId } from '@/utils/types';

export async function listMedia(): Promise<Media[]> {
  const db = await getDb();
  return db.getAllAsync<Media>(`SELECT * FROM media ORDER BY created_at DESC;`);
}

export async function insertMedia(cityId: CityId, filePath: string, type: MediaType): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    `INSERT INTO media (city_id,file_path,type,created_at) VALUES (?,?,?,?);`,
    cityId,
    filePath,
    type,
    new Date().toISOString(),
  );
  return res.lastInsertRowId as number;
}

export async function deleteMediaRow(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM media WHERE id=?;`, id);
}
