// TravelStat/scripts/build-data.ts
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

const OUT = path.resolve(__dirname, '..', 'assets', 'data');

const SOURCES = {
  countriesGeoJson:
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
  geoNamesCities:
    'https://download.geonames.org/export/dump/cities15000.zip',
};

const CONTINENTS = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica',
];

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return await res.text();
}

async function fetchBytes(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

type Country = {
  iso_code: string;
  name: string;
  continent: string;
  flag: string;
};

type City = {
  id: number;
  name: string;
  country: string;
  lat: number;
  lng: number;
  population: number;
};

function isoToFlagEmoji(iso2: string): string {
  if (!/^[A-Z]{2}$/.test(iso2)) return '🏳';
  const A = 0x1f1e6;
  return String.fromCodePoint(A + iso2.charCodeAt(0) - 65, A + iso2.charCodeAt(1) - 65);
}

async function buildCountries(): Promise<{ json: Country[]; geojsonRaw: string }> {
  const geojsonRaw = await fetchText(SOURCES.countriesGeoJson);
  const gj = JSON.parse(geojsonRaw) as { features: Array<{ properties: Record<string, any> }> };

  const seen = new Map<string, Country>();
  for (const f of gj.features) {
    const iso = (f.properties.ISO_A2_EH || f.properties.ISO_A2 || '').toUpperCase();
    const name = f.properties.NAME || f.properties.ADMIN;
    const continent = f.properties.CONTINENT || f.properties.REGION_UN || 'Other';
    if (!iso || iso === '-99' || iso.length !== 2) continue;
    if (seen.has(iso)) continue;
    seen.set(iso, {
      iso_code: iso,
      name,
      continent,
      flag: isoToFlagEmoji(iso),
    });
  }

  const json = Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  return { json, geojsonRaw };
}

async function buildCities(validIso: Set<string>): Promise<City[]> {
  const zipBuf = await fetchBytes(SOURCES.geoNamesCities);
  const AdmZip = (await import('adm-zip')).default;
  const zip = new AdmZip(zipBuf);
  const entry = zip.getEntry('cities15000.txt');
  if (!entry) throw new Error('cities15000.txt missing inside zip');
  const text = entry.getData().toString('utf8');

  const cities: City[] = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    const cols = line.split('\t');
    // GeoNames schema: geonameid, name, asciiname, alternatenames, lat, lng, fclass, fcode,
    // country, cc2, admin1, admin2, admin3, admin4, population, ...
    const id = Number(cols[0]);
    const name = cols[1];
    const lat = Number(cols[4]);
    const lng = Number(cols[5]);
    const country = cols[8];
    const population = Number(cols[14]);
    if (!Number.isFinite(id) || !name || !validIso.has(country)) continue;
    if (population < 100000) continue;
    cities.push({ id, name, country, lat, lng, population });
  }
  cities.sort((a, b) => b.population - a.population);
  return cities;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  console.log('→ countries');
  const { json: countries, geojsonRaw } = await buildCountries();
  await fs.writeFile(path.join(OUT, 'countries.geojson'), geojsonRaw);
  await fs.writeFile(path.join(OUT, 'countries.json'), JSON.stringify(countries));

  const validIso = new Set(countries.map(c => c.iso_code));

  console.log('→ cities');
  const cities = await buildCities(validIso);
  await fs.writeFile(path.join(OUT, 'cities.json'), JSON.stringify(cities));

  console.log('→ continents');
  await fs.writeFile(path.join(OUT, 'continents.json'), JSON.stringify(CONTINENTS));

  console.log(`✓ wrote ${countries.length} countries, ${cities.length} cities, ${CONTINENTS.length} continents`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
