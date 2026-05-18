# TravelStat — Design Specification

**Date:** 2026-05-18
**Status:** Approved (brainstorming complete, ready for planning)
**Author:** Tech-lead Analytics, Algonova (with Claude as architect)

---

## 1. Purpose & scope

TravelStat is a cross-platform mobile prototype that lets a user record places they've been, attach memories, and see analytics about their travel — entirely offline, with no authentication, no cloud, no accounts. All state lives in local SQLite + the device filesystem.

### Success criteria

A working prototype where the user can:

- View a world map with country borders.
- Mark countries and cities as visited by tapping them.
- Maintain a wishlist of countries to visit.
- Record travel visits with dates, notes, and **budget**.
- Attach photos and videos to cities.
- See travel statistics (countries / cities / continents / wishlist / days / cost-per-day).
- Unlock achievements automatically as state changes.

### Out of scope

- Authentication, cloud sync, multi-device sync.
- Geolocation / "current country" auto-detect (would break offline-first cleanly).
- Currency conversion via live FX (no network).
- Branded illustrations, splash screens, marketing polish.

---

## 2. Tech stack (locked)

| Concern | Choice |
|---|---|
| Framework | React Native via Expo (managed workflow), TypeScript |
| Run target | Expo Go on physical device (SDK 51+) |
| Maps | `react-native-maps` — Google Maps on Android (`PROVIDER_GOOGLE`), Apple Maps on iOS (default provider) |
| Database | `expo-sqlite` |
| State | `zustand` |
| Media | `expo-image-picker`, `expo-file-system`, `expo-video` |
| UI | `react-native-paper` |
| Navigation | `@react-navigation/native` + `@react-navigation/drawer` + `@react-navigation/stack` |
| Icons | `@expo/vector-icons` (MaterialCommunityIcons) |
| Dates | `date-fns` |

### Decision log

- **Apple Maps on iOS** — chosen so the app runs in Expo Go without a Google Maps SDK API key. Polygon/Marker rendering works identically across providers.
- **Bundled datasets** — `countries.geojson`, `countries.json`, `cities.json`, `continents.json` are generated once by a build script, committed to the repo, and shipped inside the app bundle. No runtime fetch.
- **Polygon `tappable={true}` for country detection** — native hit-testing, no JS point-in-polygon scan.
- **Base currency on profile** (Settings), with each visit storing its `budget_currency` at entry time so historical entries remain meaningful after a base-currency change.

---

## 3. Architecture

### Folder layout

```
TravelStat/
├── app.json, package.json, tsconfig.json, App.tsx
├── scripts/
│   └── build-data.ts                  # one-shot dataset builder
├── assets/
│   ├── data/
│   │   ├── countries.geojson          # Natural Earth, simplified
│   │   ├── countries.json             # iso → name, continent, flag
│   │   ├── cities.json                # filtered GeoNames, ~4000 rows
│   │   └── continents.json
│   ├── icons/
│   └── images/
└── src/
    ├── components/      # presentational only
    ├── screens/         # one file per drawer route + detail screens
    ├── store/           # Zustand stores
    ├── database/        # client, migrations, repositories
    ├── services/        # achievements, search, stats, coordinator, media
    ├── map/             # MapView wrapper, layers, viewport hook
    └── utils/           # date helpers, formatters, flag emoji, types
```

### Module boundaries

- Screens never touch SQLite directly. They read from Zustand stores and call coordinator actions.
- Stores call repositories (`src/database/repositories/`) and hold canonical in-memory state derived from SQLite rows + bundled JSON.
- Services are pure-ish logic over store snapshots (achievements, stats, search).
- The map module owns viewport state and decides which cities to render.

### Data flow

```
SQLite ─► repository ─► store (Zustand) ─► screen
                          ▲                    │
                          └── action ◄─────────┘
                          │
                       service reads store snapshot
```

### Cross-store coordination

`src/services/coordinator.ts` exposes high-level actions that touch multiple stores:

- `markCountryVisited(iso)` → countriesStore + achievementsStore.evaluate.
- `markCityVisited(id)` → citiesStore + achievementsStore.evaluate.
- `recordVisit(input)` → visitsStore + countriesStore + citiesStore + achievementsStore.evaluate.
- `attachMedia(cityId, uri, type)` → mediaStore + citiesStore (`withMedia`).

Screens call coordinator actions for anything crossing store boundaries; simple toggles (e.g., wishlist) may go direct.

---

## 4. Data layer

### Two kinds of data

| | Bundled assets (read-only) | SQLite (mutable user state) |
|---|---|---|
| Files | `assets/data/*.{json,geojson}` | `travelstat.db` in `FileSystem.documentDirectory` |
| Content | 195 countries, ~4000 cities, polygons, continents | Visited flags, wishlist, visits, media, achievements |
| Lifetime | Ships with app, never written | Created on first launch, persisted across sessions |

### SQLite schema

```sql
CREATE TABLE countries (
  iso_code   TEXT PRIMARY KEY,
  visited    INTEGER NOT NULL DEFAULT 0,
  wishlist   INTEGER NOT NULL DEFAULT 0,
  visited_at TEXT
);

CREATE TABLE cities (
  id         INTEGER PRIMARY KEY,         -- matches cities.json id
  visited    INTEGER NOT NULL DEFAULT 0,
  visited_at TEXT
);

CREATE TABLE visits (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  country_code    TEXT NOT NULL,
  city_id         INTEGER,
  start_date      TEXT NOT NULL,
  end_date        TEXT,
  notes           TEXT,
  budget          REAL,                   -- nullable
  budget_currency TEXT                    -- "USD","IDR",… set at entry time
);
CREATE INDEX idx_visits_country ON visits(country_code);
CREATE INDEX idx_visits_city    ON visits(city_id);

CREATE TABLE media (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  city_id    INTEGER NOT NULL,
  file_path  TEXT NOT NULL,
  type       TEXT NOT NULL CHECK(type IN ('photo','video')),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_media_city ON media(city_id);

CREATE TABLE achievements (
  id          TEXT PRIMARY KEY,
  unlocked    INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT
);

CREATE TABLE meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);
-- seeded: schema_version=1, base_currency="USD"
```

### Seeding (first launch)

1. Open DB, check `meta.schema_version`. If missing → run migration v1.
2. Insert empty rows for all 195 countries (visited=0, wishlist=0).
3. Insert empty rows for all ~4000 cities (visited=0).
4. Insert 5 achievement rows from static definitions.
5. Set `meta.schema_version = "1"`, `meta.base_currency = "USD"`.

### Repository pattern

One file per table under `src/database/repositories/`, each exporting plain async functions returning typed rows. No ORM.

---

## 5. State management (Zustand)

### Stores

```ts
useCountriesStore: {
  byCode: Record<string, CountryMeta>;
  geojson: FeatureCollection;
  visited: Set<string>;
  wishlist: Set<string>;
  loadFromDb(): Promise<void>;
  toggleVisited(iso): Promise<void>;
  toggleWishlist(iso): Promise<void>;
}

useCitiesStore: {
  all: City[];
  byId: Map<number, City>;
  visited: Set<number>;
  withMedia: Set<number>;
  loadFromDb(): Promise<void>;
  toggleVisited(id): Promise<void>;
}

useVisitsStore: {
  visits: Visit[];                        // sorted DESC by start_date
  loadFromDb(): Promise<void>;
  addVisit(input): Promise<void>;
  deleteVisit(id): Promise<void>;
}

useMediaStore: {
  byCity: Map<number, Media[]>;
  loadFromDb(): Promise<void>;
  addMedia(cityId, uri, type): Promise<void>;
  deleteMedia(id): Promise<void>;
}

useAchievementsStore: {
  byId: Record<string, AchievementState>;
  definitions: AchievementDef[];
  loadFromDb(): Promise<void>;
  evaluate(): Promise<string[]>;
}

useSettingsStore: {
  baseCurrency: string;                   // "USD" default
  setBaseCurrency(code): Promise<void>;
}
```

### Initialization (App.tsx mount)

1. Open DB; run migrations + seed if needed.
2. Load bundled JSON into memory (countries, cities, geojson, continents).
3. `Promise.all` of `loadFromDb()` across stores.
4. Render `<NavigationContainer>` only after step 3 resolves.

No Zustand persistence middleware — SQLite is the persistence.

---

## 6. Map module

### Files

```
src/map/
├── WorldMap.tsx
├── CountryLayer.tsx
├── CityLayer.tsx
├── useViewport.ts
└── colors.ts
```

### `WorldMap.tsx`

```tsx
<MapView
  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
  initialRegion={{ latitude: 20, longitude: 0, latitudeDelta: 100, longitudeDelta: 100 }}
  showsBuildings={false}
  pitchEnabled={false}
  rotateEnabled={false}
  onRegionChangeComplete={onRegionChange}
>
  <CountryLayer onCountryPress={…} />
  {region.latitudeDelta < 30 && <CityLayer region={region} onCityPress={…} />}
</MapView>
```

### Country rendering

- One `<Polygon tappable>` per country, `onPress` carries the ISO code from `feature.properties.ISO_A2`.
- MultiPolygon features are flattened at load time into one `<Polygon>` per ring, tagged with parent ISO.
- Fill color: visited `#34C759` @ 0.35, wishlist `#0A84FF` @ 0.30, else transparent. Stroke: 0.5px gray for all.
- Each polygon is a memoized component keyed on `iso + visitedFlag + wishlistFlag`. Re-renders only when its own flags change.

### City rendering

`CityLayer` is hidden entirely while `latitudeDelta >= 30`. Otherwise:

```ts
function visibleCities(all, region, visited, withMedia): City[] {
  const bbox = regionToBbox(region);
  const inView = all.filter(c => inBbox(c, bbox));
  if (inView.length <= 300) return inView;
  return inView
    .map(c => ({ c, rank: visited.has(c.id) ? 0 : withMedia.has(c.id) ? 1 : 2 - c.population / 1e9 }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 300)
    .map(x => x.c);
}
```

Markers via `<Marker pinColor=…>`: visited → red, has media → gold, else default pin. No custom views — keeps native rendering fast.

### Viewport hook

`useViewport` debounces `onRegionChangeComplete` by 150ms and exposes `flyTo(lat, lng, delta)` for search-result selection.

### Search

`src/services/search.ts` — `toLowerCase().includes()` against country and city names, ranked by exact-match then prefix-match. Selecting a result calls `flyTo()`. No fuzzy library needed at this scale.

### Performance budget

- Cold open: parse `countries.geojson` (~1.5 MB) and `cities.json` (~1 MB) once at app init; keep in memory.
- Steady state: ≤195 polygons + ≤300 markers on screen.
- Re-renders only on viewport change (debounced) or country flag change.

---

## 7. Screens & navigation

### Drawer routes

Drawer (hamburger menu): **Home · Map · Wishlist · Timeline · Statistics · Achievements · Settings**.

Nested stacks push detail screens (e.g., `CityDetail`, `CountryDetail`, `AddVisit`).

### Screens

| Screen | Reads | Writes |
|---|---|---|
| `HomeScreen` | all stores | — |
| `MapScreen` | countries, cities | `markCountryVisited`, `markCityVisited` via coordinator |
| `CountryDetailScreen` | countries, visits, cities | toggle visited / wishlist |
| `CityDetailScreen` | cities, media | toggle visited, attach media |
| `WishlistScreen` | countries | toggle wishlist |
| `TimelineScreen` | visits, countries, cities | — |
| `AddVisitScreen` | countries, cities, settings | `recordVisit` |
| `StatisticsScreen` | derived from stores | — |
| `AchievementsScreen` | achievements | — |
| `SettingsScreen` | settings, meta | change base currency, reset all data |

### Home stat tiles (2-col grid of Paper Cards)

1. **Countries visited** — `n / 195` + progress bar.
2. **Cities visited** — `n` (no denominator).
3. **Continents visited** — `n / 7`.
4. **Wishlist** — `n` countries.
5. **Travel days** — `Σ (end_date − start_date + 1)`.
6. **Avg / day** — `Σ budget / Σ days` over visits in `base_currency`, formatted as `~$73 / day`.

"Current country" header card shows the most recently visited country (no live geolocation).

---

## 8. Budget & duration

### Storage

- `visits.budget REAL NULL` — amount entered.
- `visits.budget_currency TEXT NULL` — currency code at the moment of entry. Set from `meta.base_currency` by default but preserved if the user later switches base currency.

### Inputs (AddVisitScreen)

- Budget: optional numeric input + non-interactive chip showing current `base_currency`.
- Duration is derived: `days = differenceInDays(end, start) + 1`. No separate input.

### Displays

- **HomeScreen**: "Avg / day" stat tile (visits in current `base_currency` only).
- **CountryDetailScreen**:
  - Days spent: sum of days across that country's visits.
  - Total budget: sum of `budget` in current `base_currency`. If multiple currencies present → list ("`$1 400 + Rp 18 000 000`").
  - **Budget per day**: `total_budget / days_spent` per currency. Direct cost-of-travel signal.
- **StatisticsScreen** — "Cost per country" table, columns: Country · Days · Budget · $/day. Sorted DESC by $/day so expensive destinations rise to the top.

### Settings

- Picker "Base currency": IDR / MYR / USD / BRL / MXN / EUR / GBP / JPY (extensible). Changes only the default for new visits; existing visits keep their historical `budget_currency`.

---

## 9. Media system

- `expo-image-picker` for photos and videos; permission requested on first use.
- On pick, `expo-file-system` copies the file from cache into `documentDirectory + "media/" + uuid + ext`. The DB stores that absolute path.
- Gallery grid: 3 columns. Photos use `<Image>`; videos render an `<Image>` thumbnail of the first frame overlaid with a play icon (Expo Video API on tap).
- No image resizing or thumbnail generation in the prototype — we trust the OS image cache.
- Settings → "Reset all data" wipes the `media/` directory and truncates all SQLite tables, then re-seeds.

---

## 10. Achievements engine

Static definitions in `src/services/achievements.ts`:

```ts
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_flight',         name: 'First Flight',         icon: 'airplane',            check: s => s.countriesVisited >= 1 },
  { id: 'explorer',             name: 'Explorer',             icon: 'compass',             check: s => s.countriesVisited >= 10 },
  { id: 'globetrotter',         name: 'Globetrotter',         icon: 'earth',               check: s => s.countriesVisited >= 30 },
  { id: 'urban_nomad',          name: 'Urban Nomad',          icon: 'city',                check: s => s.citiesVisited >= 100 },
  { id: 'continental_traveler', name: 'Continental Traveler', icon: 'map-marker-multiple', check: s => s.continentsVisited >= 5 },
];
```

`evaluate()` builds a snapshot `{countriesVisited, citiesVisited, continentsVisited}` from the stores, runs each predicate, and for any newly-true achievement writes `unlocked=1` + `unlocked_at=now()` to SQLite and updates the store. Returns the list of newly unlocked IDs so the coordinator can pop a Paper Snackbar toast.

Triggered after: country toggle, city toggle, `recordVisit`. Pure function of state — idempotent.

---

## 11. Iteration plan & validation gates

| # | Name | Deliverables | Validation gate |
|---|---|---|---|
| 0 | Dataset prep | `scripts/build-data.ts` produces `countries.geojson`, `countries.json`, `cities.json`, `continents.json`. Commit outputs. | Files exist, total <3 MB, 195 countries, ~4000 cities. |
| 1 | Bootstrap | Expo TS template, deps, folder structure, `App.tsx` with PaperProvider + Drawer + 7 stub screens. | `npx expo start` → drawer opens on device, all 7 routes render a stub. |
| 2 | Database | SQLite client, migrations v1, schema (incl. `budget`, `budget_currency`, `base_currency` in meta), 5 repositories, store skeletons that load from DB. | DB file present, all rows seeded (verified by a temp debug screen). |
| 3 | Map engine | `WorldMap`, country polygons with default transparent fill, zoom/pan/pinch. | Map opens at initialRegion, 195 borders drawn, pinch zoom works. |
| 4 | Visited countries | Polygon `tappable` → coordinator → DB → store → green fill. Home tile updates. | Tap Mexico → green; reload app → still green; Home shows "1 / 195". |
| 5 | City system | `CityLayer` with viewport filter + 300 cap, marker tap → `CityDetailScreen` with "mark visited". | At country zoom, ≤300 markers render; tap city → detail; mark visited → red pin. |
| 6 | Wishlist | Wishlist screen + search add, country detail action, blue polygon fill. | Add via search → polygon blue → wishlist screen lists it → "Jump to map" works. |
| 7 | Timeline + budget | `AddVisitScreen` (with budget input + currency chip), `TimelineScreen` chronological list, visits persist + auto-mark country/city. | Add a visit with budget → top of timeline → country green → Home avg/day updates. Reload → persists. |
| 8 | Media | Image/video picker on `CityDetailScreen`, files copied to `documentDirectory/media/`, gallery grid, gold pin for cities with media. | Add photo → grid thumbnail → city pin gold → survives app restart. |
| 9 | Statistics | Continents bar chart (Paper Surfaces sized by %), cost-per-country table, derived stats reactive. | Stats match input data; adding a visit updates stats without reload. |
| 10 | Achievements | `evaluate()` wired into coordinator, achievements grid screen, Snackbar toast on unlock, dates persist. | Mark 1 country → "First Flight" unlocks with toast; reload → unlock persists with original date. |

### Rules across every iteration

- **Compile gate**: `npx tsc --noEmit` clean before moving on. No `any` in new code.
- **Runtime gate**: app launches in Expo Go on a real device with no redbox.
- **File size cap**: 400 lines per file; if a file approaches the cap, split.
- **No regressions**: features from prior iterations still work; manual re-verification.

---

## 12. Open risks & mitigations

| Risk | Mitigation |
|---|---|
| `countries.geojson` larger than expected → app cold-start lag | Use Natural Earth Admin 0 *simplified* (1:110m); validate <2 MB. Parse once on init, never re-parse. |
| `cities.json` rendering chokes on low-end Android | Viewport filter + 300-cap built in from day one (Iteration 5). Markers use native pin (no custom view). |
| iOS vs Android polygon `tappable` behavior divergence | Test on both early in Iteration 4. Apple Maps polygon tap works on RN-maps but with a slight delay. |
| Expo Go SDK drift breaks a dep | Pin SDK at install time; fall back to a custom dev client only if a package explicitly requires it. |
| User changes base currency mid-stream | `budget_currency` is frozen per visit; stats aggregate only same-currency visits, others displayed alongside but uncombined. |

---

## 13. Release & distribution strategy

### Repository

- GitHub: [`irakliygotsiridze-cmd/tre`](https://github.com/irakliygotsiridze-cmd/tre), public.
- Branch model: `main` is always shippable. Feature work on `iteration-N-<name>` branches, merged via squash after the validation gate passes.

### Android — APK as GitHub Release

- Build: `eas build --platform android --profile preview` (produces a standalone `.apk`).
- Cadence: after each iteration validation gate passes, tag `v0.<iter>.0`, attach `.apk` to a GitHub Release titled `Iteration <N>: <name>`.
- EAS Build free tier: 30 builds/month — enough for our 10 iterations with margin.
- `eas.json` profiles: `development` (dev client, for iteration in Expo Go), `preview` (apk, internal testing), `production` (aab, deferred).

### iOS — deferred

- Distributable IPA requires an Apple Developer account ($99/year) for signing.
- Until then: no iOS GitHub Releases. Status flagged in README as **«iOS release pending Apple Developer account»**.
- Once available: same cadence as Android, profile `preview` produces a TestFlight-eligible IPA; attach a download link in the GitHub Release notes.

### Automation

- Manual at first: I run `eas build`, download APK, attach via `git tag` + GitHub Release.
- A `.github/workflows/release.yml` adding EAS build + auto-upload is **out of scope for the prototype** but called out as a follow-up.

---

## 14. Definitions of done

The prototype is shippable when:

- All 10 iteration validation gates have passed in sequence on a real Expo Go device.
- A new user can: open the app → tap-mark a country and city → add a wishlist entry → record a visit with budget → attach a photo → see stats and an unlocked achievement, all offline, all surviving an app restart.
- `npx tsc --noEmit` is clean.
- No file exceeds 400 lines.
