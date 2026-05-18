import Database from 'better-sqlite3';

const SCHEMA_V1 = `
CREATE TABLE countries (iso_code TEXT PRIMARY KEY, visited INTEGER NOT NULL DEFAULT 0, wishlist INTEGER NOT NULL DEFAULT 0, visited_at TEXT);
CREATE TABLE cities (id INTEGER PRIMARY KEY, visited INTEGER NOT NULL DEFAULT 0, visited_at TEXT);
CREATE TABLE visits (id INTEGER PRIMARY KEY AUTOINCREMENT, country_code TEXT NOT NULL, city_id INTEGER, start_date TEXT NOT NULL, end_date TEXT, notes TEXT, budget REAL, budget_currency TEXT);
CREATE TABLE media (id INTEGER PRIMARY KEY AUTOINCREMENT, city_id INTEGER NOT NULL, file_path TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('photo','video')), created_at TEXT NOT NULL);
CREATE TABLE achievements (id TEXT PRIMARY KEY, unlocked INTEGER NOT NULL DEFAULT 0, unlocked_at TEXT);
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
`;

describe('schema v1', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(SCHEMA_V1);
  });

  afterEach(() => db.close());

  it('inserts and updates a country visited flag', () => {
    db.prepare(`INSERT INTO countries (iso_code) VALUES (?)`).run('MX');
    db.prepare(`UPDATE countries SET visited=1, visited_at=? WHERE iso_code=?`).run('2026-05-18', 'MX');
    const row = db.prepare(`SELECT * FROM countries WHERE iso_code=?`).get('MX') as any;
    expect(row.visited).toBe(1);
    expect(row.visited_at).toBe('2026-05-18');
  });

  it('inserts a visit with budget and reads it back', () => {
    const r = db.prepare(
      `INSERT INTO visits (country_code,city_id,start_date,end_date,notes,budget,budget_currency)
       VALUES (?,?,?,?,?,?,?)`,
    ).run('MX', null, '2026-01-01', '2026-01-10', 'Cancun', 1400, 'USD');
    expect(r.lastInsertRowid).toBe(1);
    const v = db.prepare(`SELECT * FROM visits`).get() as any;
    expect(v.budget).toBe(1400);
    expect(v.budget_currency).toBe('USD');
  });

  it('rejects unknown media type', () => {
    expect(() =>
      db.prepare(
        `INSERT INTO media (city_id,file_path,type,created_at) VALUES (?,?,?,?)`,
      ).run(1, '/x', 'audio', '2026-01-01'),
    ).toThrow();
  });
});
