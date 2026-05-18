import { getDb } from './client';
import countriesJson from '../../assets/data/countries.json';
import citiesJson from '../../assets/data/cities.json';
import { ACHIEVEMENTS } from '@/services/achievements';
import type { CountryMeta, City } from '@/utils/types';

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS countries (
  iso_code   TEXT PRIMARY KEY,
  visited    INTEGER NOT NULL DEFAULT 0,
  wishlist   INTEGER NOT NULL DEFAULT 0,
  visited_at TEXT
);
CREATE TABLE IF NOT EXISTS cities (
  id         INTEGER PRIMARY KEY,
  visited    INTEGER NOT NULL DEFAULT 0,
  visited_at TEXT
);
CREATE TABLE IF NOT EXISTS visits (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  country_code    TEXT NOT NULL,
  city_id         INTEGER,
  start_date      TEXT NOT NULL,
  end_date        TEXT,
  notes           TEXT,
  budget          REAL,
  budget_currency TEXT
);
CREATE INDEX IF NOT EXISTS idx_visits_country ON visits(country_code);
CREATE INDEX IF NOT EXISTS idx_visits_city    ON visits(city_id);
CREATE TABLE IF NOT EXISTS media (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  city_id    INTEGER NOT NULL,
  file_path  TEXT NOT NULL,
  type       TEXT NOT NULL CHECK(type IN ('photo','video')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_city ON media(city_id);
CREATE TABLE IF NOT EXISTS achievements (
  id          TEXT PRIMARY KEY,
  unlocked    INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT
);
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);
`;

async function getSchemaVersion(): Promise<number> {
  const db = await getDb();
  await db.execAsync(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);`);
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = 'schema_version';`
  );
  return row ? Number(row.value) : 0;
}

async function setSchemaVersion(v: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO meta (key,value) VALUES ('schema_version',?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value;`,
    String(v),
  );
}

export async function runMigrations(): Promise<void> {
  const v = await getSchemaVersion();
  const db = await getDb();
  if (v < 1) {
    await db.execAsync(SCHEMA_V1);
    await seedV1();
    await setSchemaVersion(1);
  }
}

async function seedV1(): Promise<void> {
  const db = await getDb();
  const countries = countriesJson as CountryMeta[];
  const cities = citiesJson as City[];

  await db.withTransactionAsync(async () => {
    for (const c of countries) {
      await db.runAsync(
        `INSERT OR IGNORE INTO countries (iso_code,visited,wishlist) VALUES (?,0,0);`,
        c.iso_code,
      );
    }
    for (const city of cities) {
      await db.runAsync(
        `INSERT OR IGNORE INTO cities (id,visited) VALUES (?,0);`,
        city.id,
      );
    }
    for (const a of ACHIEVEMENTS) {
      await db.runAsync(
        `INSERT OR IGNORE INTO achievements (id,unlocked) VALUES (?,0);`,
        a.id,
      );
    }
    await db.runAsync(
      `INSERT OR IGNORE INTO meta (key,value) VALUES ('base_currency','USD');`,
    );
  });
}
