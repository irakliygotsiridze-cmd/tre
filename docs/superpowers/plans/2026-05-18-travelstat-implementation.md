# TravelStat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the TravelStat offline-first mobile prototype across 11 sequential iterations, producing a tagged Android APK GitHub Release at the end of every iteration whose validation gate passes.

**Architecture:** React Native + Expo (managed), TypeScript strict. Two data sources: bundled JSON/GeoJSON for the world (countries, cities, polygons) and SQLite for mutable user state (visits, media, achievements). Five Zustand stores fed by per-table repositories. Screens read from stores and call a coordinator for cross-store actions.

**Tech Stack:** Expo SDK 51+, TypeScript, react-native-maps, expo-sqlite, expo-image-picker, expo-file-system, expo-video, zustand, react-native-paper, @react-navigation/{native,drawer,stack}, date-fns, jest + jest-expo, @testing-library/react-native, EAS Build (Android APK).

**Spec:** [`docs/superpowers/specs/2026-05-18-travelstat-design.md`](../specs/2026-05-18-travelstat-design.md).

**Repo:** https://github.com/irakliygotsiridze-cmd/tre (root: `C:\Users\User\Desktop\тре`). The Expo project lives in a `TravelStat/` subdirectory of the repo to keep the spec/plan separate from app source.

---

## 0. Conventions (read once, applies to every task)

- **Working directory for npm/expo commands:** `C:\Users\User\Desktop\тре\TravelStat` (after Iteration 1 creates it). The plan-and-spec live one level up.
- **TypeScript:** strict mode, `noImplicitAny`, `strictNullChecks`. Path alias `@/` → `TravelStat/src/`.
- **Tests:**
  - Logic tests with Jest (`jest-expo` preset). File pattern `*.test.ts(x)`, colocated next to the unit under test, or under `TravelStat/__tests__/`.
  - Run with `npm test` (configured in Iteration 1).
  - **Skip UI rendering tests for screens that need the map or native modules** — those are validated manually on device.
- **Commit style:** Conventional commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`). Sign-off footer:

  ```
  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- **Commits frequency:** after each task. Tag + GitHub Release at the end of each iteration.
- **File size cap:** 400 lines. If approaching, split before committing.
- **Quality gates run at the end of each iteration (in order):**
  1. `npx tsc --noEmit` — clean.
  2. `npm test` — all green.
  3. Manual smoke: load on Expo Go on a physical Android device, execute the iteration's validation gate scenario.
  4. `eas build --platform android --profile preview` from iter 1 onward → upload APK to a tagged GitHub Release.
- **EAS auth:** Iteration 1 sets it up; engineer runs `eas login` interactively once.

---

## 1. Final file structure (target)

```
TravelStat/
├── app.json, package.json, package-lock.json, tsconfig.json
├── babel.config.js, metro.config.js, jest.config.js
├── eas.json, .easignore
├── App.tsx
├── scripts/
│   └── build-data.ts
├── assets/
│   ├── data/
│   │   ├── countries.geojson
│   │   ├── countries.json
│   │   ├── cities.json
│   │   └── continents.json
│   └── images/, icons/                   # empty placeholders for now
└── src/
    ├── components/
    │   ├── StatCard.tsx
    │   ├── ProgressBar.tsx
    │   ├── CountryListItem.tsx
    │   ├── CityListItem.tsx
    │   ├── VisitListItem.tsx
    │   └── AchievementBadge.tsx
    ├── screens/
    │   ├── HomeScreen.tsx
    │   ├── MapScreen.tsx
    │   ├── CountryDetailScreen.tsx
    │   ├── CityDetailScreen.tsx
    │   ├── WishlistScreen.tsx
    │   ├── TimelineScreen.tsx
    │   ├── AddVisitScreen.tsx
    │   ├── StatisticsScreen.tsx
    │   ├── AchievementsScreen.tsx
    │   └── SettingsScreen.tsx
    ├── navigation/
    │   ├── RootDrawer.tsx
    │   └── MapStack.tsx
    ├── store/
    │   ├── useCountriesStore.ts
    │   ├── useCitiesStore.ts
    │   ├── useVisitsStore.ts
    │   ├── useMediaStore.ts
    │   ├── useAchievementsStore.ts
    │   └── useSettingsStore.ts
    ├── database/
    │   ├── client.ts
    │   ├── migrations.ts
    │   └── repositories/
    │       ├── countries.ts
    │       ├── cities.ts
    │       ├── visits.ts
    │       ├── media.ts
    │       ├── achievements.ts
    │       └── meta.ts
    ├── services/
    │   ├── coordinator.ts
    │   ├── achievements.ts
    │   ├── stats.ts
    │   ├── search.ts
    │   └── media.ts
    ├── map/
    │   ├── WorldMap.tsx
    │   ├── CountryLayer.tsx
    │   ├── CityLayer.tsx
    │   ├── useViewport.ts
    │   ├── viewport.ts                   # pure helpers (bbox, visibleCities)
    │   └── colors.ts
    └── utils/
        ├── types.ts
        ├── dates.ts
        ├── currency.ts
        └── flags.ts
```

---

# Iteration 0 — Dataset preparation

Produce the bundled assets the app ships with. This is the only iteration that doesn't have a runnable app at the end — just committed JSON files.

**Validation gate:** `assets/data/` contains four files, totals <3 MB, `countries.json` has 195 entries, `cities.json` has roughly 4000 entries.

### Task 0.1: Initialize the TravelStat subdirectory and scripts dependencies

**Files:**
- Create: `TravelStat/package.json` (root for scripts only, will be extended in Iter 1)
- Create: `TravelStat/scripts/build-data.ts`
- Create: `TravelStat/tsconfig.scripts.json`

- [ ] **Step 1: Create directory and minimal package.json**

```bash
mkdir -p TravelStat/scripts TravelStat/assets/data
cd TravelStat
```

Create `TravelStat/package.json`:

```json
{
  "name": "travelstat-scripts",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build:data": "ts-node --project tsconfig.scripts.json scripts/build-data.ts"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Install script deps**

```bash
cd TravelStat
npm install
```

Expected: no errors, `node_modules/` populated.

- [ ] **Step 3: Create `tsconfig.scripts.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "dist-scripts"
  },
  "include": ["scripts/**/*"]
}
```

- [ ] **Step 4: Commit**

```bash
git add TravelStat/package.json TravelStat/tsconfig.scripts.json TravelStat/.gitignore
git commit -m "chore: init TravelStat scripts package"
```

If `.gitignore` doesn't yet exclude `TravelStat/node_modules/`, add a `TravelStat/.gitignore` with `node_modules/` first.

---

### Task 0.2: Implement `build-data.ts`

The script downloads Natural Earth countries (1:110m) and GeoNames cities (population >100k) from public mirrors, normalizes them, and writes four files to `assets/data/`.

**Files:**
- Create: `TravelStat/scripts/build-data.ts`

- [ ] **Step 1: Write the script**

```ts
// TravelStat/scripts/build-data.ts
import { createWriteStream, promises as fs } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as path from 'node:path';
import * as zlib from 'node:zlib';

const OUT = path.resolve(__dirname, '..', 'assets', 'data');

const SOURCES = {
  countriesGeoJson:
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
  geoNamesCities:
    'https://download.geonames.org/export/dump/cities15000.zip',
  isoCountryList:
    'https://raw.githubusercontent.com/datasets/country-codes/master/data/country-codes.csv',
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
  // cities15000.zip contains cities15000.txt (tab-separated, headerless)
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
```

- [ ] **Step 2: Install runtime helper dep**

```bash
cd TravelStat
npm install --save-dev adm-zip @types/adm-zip
```

- [ ] **Step 3: Run the script**

```bash
cd TravelStat
npm run build:data
```

Expected output (approximately):

```
→ countries
→ cities
→ continents
✓ wrote 195 countries, ~4000 cities, 7 continents
```

- [ ] **Step 4: Verify sizes**

```bash
ls -la TravelStat/assets/data/
```

Expected: total under ~3 MB. `countries.geojson` ≈ 800 KB – 1.5 MB; `cities.json` ≈ 600 KB – 1 MB; `countries.json` < 50 KB; `continents.json` < 1 KB.

If `countries.json` does not contain exactly 195 entries (Natural Earth's count is typically 196 — includes Antarctica), inspect with:

```bash
node -e "console.log(require('./assets/data/countries.json').length)"
```

If 196, that's fine (we accept Antarctica too). The validation gate accepts 190–200.

- [ ] **Step 5: Commit the datasets**

```bash
git add TravelStat/scripts/build-data.ts TravelStat/package.json TravelStat/package-lock.json TravelStat/assets/data/
git commit -m "feat(data): bundle countries, cities, continents datasets"
```

---

### Task 0.3: Tag Iteration 0

- [ ] **Step 1: Tag and push**

```bash
git tag v0.0.0 -m "Iteration 0: datasets"
git push origin main --tags
```

- [ ] **Step 2: Create GitHub release manually**

Since we don't yet have an APK, create a release at https://github.com/irakliygotsiridze-cmd/tre/releases/new pointing to tag `v0.0.0`, title **"Iteration 0: Datasets"**, body: "Bundled Natural Earth countries + GeoNames cities under `TravelStat/assets/data/`."

No binary upload yet.

---

# Iteration 1 — Project bootstrap

Scaffold Expo + TypeScript app inside `TravelStat/`, install all dependencies, wire React Navigation Drawer with 7 stub screens.

**Validation gate:** `npx expo start` → scan QR with Expo Go on Android → drawer opens, navigating through all 7 routes renders a different stub on each.

### Task 1.1: Create the Expo app

**Files:**
- Create/overwrite: `TravelStat/app.json`, `TravelStat/tsconfig.json`, `TravelStat/babel.config.js`, `TravelStat/App.tsx`
- Modify: `TravelStat/package.json` (merge Expo deps with the script deps already installed)

- [ ] **Step 1: Scaffold using Expo template (we'll merge into existing dir)**

Because `TravelStat/` already has `package.json` (scripts) and `assets/data/`, we cannot use `create-expo-app` in-place. Instead, scaffold in a temp dir and copy over.

```bash
cd C:\Users\User\Desktop\тре
npx create-expo-app@latest .travelstat-tmp -t blank-typescript --no-install
```

- [ ] **Step 2: Merge scaffold into TravelStat/**

Copy these files from `.travelstat-tmp` into `TravelStat/`, overwriting if present:

- `App.tsx`
- `app.json`
- `babel.config.js`
- `tsconfig.json`
- `index.ts` (if present)
- `assets/icon.png`, `assets/splash-icon.png`, `assets/adaptive-icon.png`, `assets/favicon.png` (preserve `assets/data/` untouched)

Merge `.travelstat-tmp/package.json` `dependencies` and `scripts` into `TravelStat/package.json`. Keep our existing `devDependencies` (adm-zip, ts-node, etc.). Use this final shape:

```json
{
  "name": "travelstat",
  "version": "0.0.1",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "build:data": "ts-node --project tsconfig.scripts.json scripts/build-data.ts",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-maps": "1.14.0",
    "expo-sqlite": "~14.0.6",
    "expo-file-system": "~17.0.1",
    "expo-image-picker": "~15.0.7",
    "expo-video": "~1.2.4",
    "expo-status-bar": "~1.12.1",
    "expo-constants": "~16.0.2",
    "zustand": "^4.5.2",
    "react-native-paper": "^5.12.3",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "react-native-gesture-handler": "~2.16.1",
    "react-native-reanimated": "~3.10.1",
    "@react-navigation/native": "^6.1.17",
    "@react-navigation/drawer": "^6.6.15",
    "@react-navigation/stack": "^6.3.29",
    "@expo/vector-icons": "^14.0.2",
    "date-fns": "^3.6.0",
    "react-native-uuid": "^2.0.2"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.79",
    "@types/node": "^20.11.0",
    "@types/adm-zip": "^0.5.5",
    "adm-zip": "^0.5.16",
    "ts-node": "^10.9.2",
    "typescript": "~5.3.3",
    "jest": "^29.7.0",
    "jest-expo": "~51.0.4",
    "@testing-library/react-native": "^12.5.0",
    "@types/jest": "^29.5.12"
  },
  "private": true
}
```

Important: drop the `expo-router/entry` main if Expo template uses raw `App.tsx`. If the template main is `"node_modules/expo/AppEntry.js"`, use that instead. Inspect what the template produced and copy verbatim.

- [ ] **Step 3: Delete the temp scaffold**

```bash
cd C:\Users\User\Desktop\тре
rmdir /S /Q .travelstat-tmp
```

- [ ] **Step 4: Install merged deps**

```bash
cd TravelStat
rm -rf node_modules package-lock.json
npm install
```

- [ ] **Step 5: Configure tsconfig with path alias**

Overwrite `TravelStat/tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "jsx": "react-native"
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules", "scripts/**/*"]
}
```

Update `TravelStat/babel.config.js` to support path alias:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: { '@': './src' },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
```

```bash
npm install --save-dev babel-plugin-module-resolver
```

- [ ] **Step 6: Configure Jest**

Create `TravelStat/jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEach: [],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

- [ ] **Step 7: Verify typecheck and test runner**

```bash
cd TravelStat
npx tsc --noEmit
npm test -- --passWithNoTests
```

Both must succeed.

- [ ] **Step 8: Commit**

```bash
git add TravelStat/
git commit -m "feat: scaffold Expo + TypeScript app with path alias and jest"
```

---

### Task 1.2: Create folder skeleton + 7 stub screens + drawer navigation

**Files:**
- Create all directories under `TravelStat/src/`
- Create stub screens: `TravelStat/src/screens/{Home,Map,Wishlist,Timeline,Statistics,Achievements,Settings}Screen.tsx`
- Create: `TravelStat/src/navigation/RootDrawer.tsx`
- Overwrite: `TravelStat/App.tsx`

- [ ] **Step 1: Create directory structure**

```bash
cd TravelStat
mkdir -p src/components src/screens src/store src/database/repositories src/services src/map src/utils src/navigation
```

- [ ] **Step 2: Write 7 identical-shape stub screens**

For each `<Name>` in {Home, Map, Wishlist, Timeline, Statistics, Achievements, Settings}, create `TravelStat/src/screens/<Name>Screen.tsx` with this template (substitute `Home` with the actual name):

```tsx
// TravelStat/src/screens/HomeScreen.tsx
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function HomeScreen() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
      <Text variant="headlineMedium">Home</Text>
    </View>
  );
}
```

Repeat for all 7 screens with the matching label.

- [ ] **Step 3: Write the drawer navigator**

```tsx
// TravelStat/src/navigation/RootDrawer.tsx
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from '@/screens/HomeScreen';
import MapScreen from '@/screens/MapScreen';
import WishlistScreen from '@/screens/WishlistScreen';
import TimelineScreen from '@/screens/TimelineScreen';
import StatisticsScreen from '@/screens/StatisticsScreen';
import AchievementsScreen from '@/screens/AchievementsScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Drawer = createDrawerNavigator();

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const icon = (name: IconName) =>
  ({ color, size }: { color: string; size: number }) =>
    <MaterialCommunityIcons name={name} color={color} size={size} />;

export default function RootDrawer() {
  return (
    <Drawer.Navigator initialRouteName="Home">
      <Drawer.Screen name="Home"         component={HomeScreen}         options={{ drawerIcon: icon('home') }} />
      <Drawer.Screen name="Map"          component={MapScreen}          options={{ drawerIcon: icon('map') }} />
      <Drawer.Screen name="Wishlist"     component={WishlistScreen}     options={{ drawerIcon: icon('heart-outline') }} />
      <Drawer.Screen name="Timeline"     component={TimelineScreen}     options={{ drawerIcon: icon('timeline') }} />
      <Drawer.Screen name="Statistics"   component={StatisticsScreen}   options={{ drawerIcon: icon('chart-bar') }} />
      <Drawer.Screen name="Achievements" component={AchievementsScreen} options={{ drawerIcon: icon('trophy-outline') }} />
      <Drawer.Screen name="Settings"     component={SettingsScreen}     options={{ drawerIcon: icon('cog-outline') }} />
    </Drawer.Navigator>
  );
}
```

- [ ] **Step 4: Wire `App.tsx`**

```tsx
// TravelStat/App.tsx
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootDrawer from '@/navigation/RootDrawer';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={MD3LightTheme}>
          <NavigationContainer>
            <RootDrawer />
          </NavigationContainer>
          <StatusBar style="auto" />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 5: Typecheck**

```bash
cd TravelStat
npx tsc --noEmit
```

Must be clean.

- [ ] **Step 6: Run on device**

```bash
cd TravelStat
npx expo start --tunnel
```

Scan QR with Expo Go. Open drawer (swipe from left). Tap each of the 7 entries — each shows a centered label.

- [ ] **Step 7: Commit**

```bash
git add TravelStat/src/ TravelStat/App.tsx
git commit -m "feat(nav): drawer with 7 stub screens"
```

---

### Task 1.3: Set up EAS Build for Android preview APKs

**Files:**
- Create: `TravelStat/eas.json`
- Create: `TravelStat/.easignore`
- Modify: `TravelStat/app.json` (add `expo.android.package`, `expo.ios.bundleIdentifier`)

- [ ] **Step 1: Install EAS CLI globally (one-time)**

```bash
npm install -g eas-cli
eas --version
```

- [ ] **Step 2: Authenticate (interactive — engineer runs this once)**

```bash
eas login
```

Expects existing Expo account or sign-up.

- [ ] **Step 3: Update `app.json`**

```json
{
  "expo": {
    "name": "TravelStat",
    "slug": "travelstat",
    "version": "0.1.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "team.alg.travelstat"
    },
    "android": {
      "package": "team.alg.travelstat",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": { "favicon": "./assets/favicon.png" }
  }
}
```

- [ ] **Step 4: Create `eas.json`**

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

- [ ] **Step 5: Create `.easignore`** (exclude scripts and node-only files from the build context)

```
scripts/
tsconfig.scripts.json
.travelstat-tmp/
docs/
```

- [ ] **Step 6: Initialize the project on EAS**

```bash
cd TravelStat
eas project:init
```

Accept project creation prompts.

- [ ] **Step 7: Commit**

```bash
git add TravelStat/eas.json TravelStat/.easignore TravelStat/app.json
git commit -m "chore: configure EAS Build for Android preview APKs"
```

---

### Task 1.4: Cut Iteration 1 release

- [ ] **Step 1: Run all gates**

```bash
cd TravelStat
npx tsc --noEmit && npm test -- --passWithNoTests
```

Both green.

- [ ] **Step 2: Build APK**

```bash
cd TravelStat
eas build --platform android --profile preview --non-interactive
```

When the build finishes (~15–25 min in EAS cloud), download the APK to `C:\Users\User\Desktop\тре\releases\travelstat-v0.1.0.apk`.

- [ ] **Step 3: Tag and push**

```bash
cd C:\Users\User\Desktop\тре
git tag v0.1.0 -m "Iteration 1: bootstrap"
git push origin main --tags
```

- [ ] **Step 4: Create GitHub Release**

Without `gh` CLI, do it via browser at https://github.com/irakliygotsiridze-cmd/tre/releases/new:
- Tag: `v0.1.0`
- Title: `Iteration 1: Bootstrap`
- Body: short summary of what's runnable.
- Attach: `releases/travelstat-v0.1.0.apk`.

---

# Iteration 2 — Database layer

SQLite client + schema migration v1 + seed + 6 repositories + 6 store skeletons that load from DB. Includes a temporary debug screen to verify seeding succeeded.

**Validation gate:** Fresh install on Expo Go → debug screen shows "195 countries seeded, ~4000 cities seeded, 5 achievements seeded".

### Task 2.1: Type definitions

**Files:**
- Create: `TravelStat/src/utils/types.ts`

- [ ] **Step 1: Write the file**

```ts
// TravelStat/src/utils/types.ts
export type IsoCode = string;
export type CityId = number;

export interface CountryMeta {
  iso_code: IsoCode;
  name: string;
  continent: string;
  flag: string;
}

export interface City {
  id: CityId;
  name: string;
  country: IsoCode;
  lat: number;
  lng: number;
  population: number;
}

export interface Visit {
  id: number;
  country_code: IsoCode;
  city_id: CityId | null;
  start_date: string;        // ISO yyyy-MM-dd
  end_date: string | null;
  notes: string | null;
  budget: number | null;
  budget_currency: string | null;
}

export interface NewVisit {
  country_code: IsoCode;
  city_id?: CityId;
  start_date: string;
  end_date?: string;
  notes?: string;
  budget?: number;
  budget_currency?: string;
}

export type MediaType = 'photo' | 'video';

export interface Media {
  id: number;
  city_id: CityId;
  file_path: string;
  type: MediaType;
  created_at: string;        // ISO
}

export interface AchievementDef {
  id: string;
  name: string;
  icon: string;              // MaterialCommunityIcons name
  description: string;
  check: (snapshot: AchievementSnapshot) => boolean;
}

export interface AchievementState {
  id: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface AchievementSnapshot {
  countriesVisited: number;
  citiesVisited: number;
  continentsVisited: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add TravelStat/src/utils/types.ts
git commit -m "feat(types): core domain types"
```

---

### Task 2.2: SQLite client + migration runner

**Files:**
- Create: `TravelStat/src/database/client.ts`
- Create: `TravelStat/src/database/migrations.ts`

- [ ] **Step 1: Write the client**

```ts
// TravelStat/src/database/client.ts
import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('travelstat.db');
  await _db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return _db;
}

export async function closeDb(): Promise<void> {
  if (!_db) return;
  await _db.closeAsync();
  _db = null;
}
```

- [ ] **Step 2: Write the migration runner**

```ts
// TravelStat/src/database/migrations.ts
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
```

- [ ] **Step 3: Commit**

```bash
git add TravelStat/src/database/client.ts TravelStat/src/database/migrations.ts
git commit -m "feat(db): sqlite client and schema v1 migration"
```

(`ACHIEVEMENTS` import is forward-declared and built in Task 2.4 — keep this commit; the next two tasks close the loop. TypeCheck will fail temporarily; that's acceptable mid-iteration provided we fix before the iteration gate.)

---

### Task 2.3: Repositories (one per table)

**Files:**
- Create: `TravelStat/src/database/repositories/{countries,cities,visits,media,achievements,meta}.ts`

- [ ] **Step 1: `countries.ts`**

```ts
// TravelStat/src/database/repositories/countries.ts
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
```

- [ ] **Step 2: `cities.ts`**

```ts
// TravelStat/src/database/repositories/cities.ts
import { getDb } from '../client';
import type { CityId } from '@/utils/types';

export interface CityRow {
  id: CityId;
  visited: number;
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
```

- [ ] **Step 3: `visits.ts`**

```ts
// TravelStat/src/database/repositories/visits.ts
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
```

- [ ] **Step 4: `media.ts`**

```ts
// TravelStat/src/database/repositories/media.ts
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
```

- [ ] **Step 5: `achievements.ts`**

```ts
// TravelStat/src/database/repositories/achievements.ts
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
```

- [ ] **Step 6: `meta.ts`**

```ts
// TravelStat/src/database/repositories/meta.ts
import { getDb } from '../client';

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key=?;`,
    key,
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO meta (key,value) VALUES (?,?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value;`,
    key,
    value,
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add TravelStat/src/database/repositories/
git commit -m "feat(db): repositories per table"
```

---

### Task 2.4: Achievements service (definitions only — engine in Iter 10)

**Files:**
- Create: `TravelStat/src/services/achievements.ts`

- [ ] **Step 1: Write definitions**

```ts
// TravelStat/src/services/achievements.ts
import type { AchievementDef } from '@/utils/types';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_flight',
    name: 'First Flight',
    icon: 'airplane',
    description: 'Visit your first country',
    check: s => s.countriesVisited >= 1,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    icon: 'compass',
    description: 'Visit 10 countries',
    check: s => s.countriesVisited >= 10,
  },
  {
    id: 'globetrotter',
    name: 'Globetrotter',
    icon: 'earth',
    description: 'Visit 30 countries',
    check: s => s.countriesVisited >= 30,
  },
  {
    id: 'urban_nomad',
    name: 'Urban Nomad',
    icon: 'city',
    description: 'Visit 100 cities',
    check: s => s.citiesVisited >= 100,
  },
  {
    id: 'continental_traveler',
    name: 'Continental Traveler',
    icon: 'map-marker-multiple',
    description: 'Visit 5 continents',
    check: s => s.continentsVisited >= 5,
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add TravelStat/src/services/achievements.ts
git commit -m "feat(services): static achievement definitions"
```

---

### Task 2.5: Test repositories with an in-memory DB

The challenge: `expo-sqlite` requires the native module. We unit-test only the migration SQL and repository SQL by spawning a Jest-only adapter.

**Files:**
- Create: `TravelStat/__tests__/db.test.ts`

- [ ] **Step 1: Install pure-JS SQLite for tests**

```bash
cd TravelStat
npm install --save-dev better-sqlite3 @types/better-sqlite3
```

- [ ] **Step 2: Write the test**

```ts
// TravelStat/__tests__/db.test.ts
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
```

- [ ] **Step 3: Run the test**

```bash
cd TravelStat
npm test -- db.test
```

Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add TravelStat/__tests__/db.test.ts TravelStat/package.json TravelStat/package-lock.json
git commit -m "test(db): schema v1 invariants"
```

---

### Task 2.6: Zustand stores (skeletons that load from DB)

**Files:**
- Create: `TravelStat/src/store/{useCountriesStore,useCitiesStore,useVisitsStore,useMediaStore,useAchievementsStore,useSettingsStore}.ts`

- [ ] **Step 1: `useCountriesStore.ts`**

```ts
// TravelStat/src/store/useCountriesStore.ts
import { create } from 'zustand';
import type { FeatureCollection } from 'geojson';
import countriesJson from '../../assets/data/countries.json';
import countriesGeoJson from '../../assets/data/countries.geojson';
import { listCountries, setCountryVisited, setCountryWishlist } from '@/database/repositories/countries';
import type { CountryMeta, IsoCode } from '@/utils/types';

interface State {
  byCode: Record<IsoCode, CountryMeta>;
  geojson: FeatureCollection;
  visited: Set<IsoCode>;
  wishlist: Set<IsoCode>;
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  toggleVisited: (iso: IsoCode) => Promise<void>;
  toggleWishlist: (iso: IsoCode) => Promise<void>;
}

const initialByCode: Record<IsoCode, CountryMeta> = Object.fromEntries(
  (countriesJson as CountryMeta[]).map(c => [c.iso_code, c]),
);

export const useCountriesStore = create<State>((set, get) => ({
  byCode: initialByCode,
  geojson: countriesGeoJson as unknown as FeatureCollection,
  visited: new Set(),
  wishlist: new Set(),
  loaded: false,
  loadFromDb: async () => {
    const rows = await listCountries();
    set({
      visited: new Set(rows.filter(r => r.visited === 1).map(r => r.iso_code)),
      wishlist: new Set(rows.filter(r => r.wishlist === 1).map(r => r.iso_code)),
      loaded: true,
    });
  },
  toggleVisited: async iso => {
    const isV = get().visited.has(iso);
    await setCountryVisited(iso, !isV);
    set(s => {
      const next = new Set(s.visited);
      isV ? next.delete(iso) : next.add(iso);
      return { visited: next };
    });
  },
  toggleWishlist: async iso => {
    const isW = get().wishlist.has(iso);
    await setCountryWishlist(iso, !isW);
    set(s => {
      const next = new Set(s.wishlist);
      isW ? next.delete(iso) : next.add(iso);
      return { wishlist: next };
    });
  },
}));
```

- [ ] **Step 2: Add Metro JSON+GeoJSON resolver**

The `.geojson` import isn't recognized by default. Update `TravelStat/metro.config.js`:

```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('geojson');
config.resolver.sourceExts.push('geojson');
module.exports = config;
```

Then add a type shim at `TravelStat/src/utils/geojson.d.ts`:

```ts
declare module '*.geojson' {
  const value: any;
  export default value;
}
```

- [ ] **Step 3: `useCitiesStore.ts`**

```ts
// TravelStat/src/store/useCitiesStore.ts
import { create } from 'zustand';
import citiesJson from '../../assets/data/cities.json';
import { listCities, setCityVisited } from '@/database/repositories/cities';
import type { City, CityId } from '@/utils/types';

interface State {
  all: City[];
  byId: Map<CityId, City>;
  visited: Set<CityId>;
  withMedia: Set<CityId>;
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  toggleVisited: (id: CityId) => Promise<void>;
  setWithMedia: (ids: Set<CityId>) => void;
}

const all = citiesJson as City[];
const byId = new Map(all.map(c => [c.id, c]));

export const useCitiesStore = create<State>((set, get) => ({
  all,
  byId,
  visited: new Set(),
  withMedia: new Set(),
  loaded: false,
  loadFromDb: async () => {
    const rows = await listCities();
    set({
      visited: new Set(rows.filter(r => r.visited === 1).map(r => r.id)),
      loaded: true,
    });
  },
  toggleVisited: async id => {
    const isV = get().visited.has(id);
    await setCityVisited(id, !isV);
    set(s => {
      const next = new Set(s.visited);
      isV ? next.delete(id) : next.add(id);
      return { visited: next };
    });
  },
  setWithMedia: ids => set({ withMedia: ids }),
}));
```

- [ ] **Step 4: `useVisitsStore.ts`**

```ts
// TravelStat/src/store/useVisitsStore.ts
import { create } from 'zustand';
import { listVisits, insertVisit, deleteVisit as repoDelete } from '@/database/repositories/visits';
import type { Visit, NewVisit } from '@/utils/types';

interface State {
  visits: Visit[];
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  addVisit: (v: NewVisit) => Promise<Visit>;
  deleteVisit: (id: number) => Promise<void>;
}

export const useVisitsStore = create<State>((set, get) => ({
  visits: [],
  loaded: false,
  loadFromDb: async () => set({ visits: await listVisits(), loaded: true }),
  addVisit: async input => {
    const id = await insertVisit(input);
    const visit: Visit = {
      id,
      country_code: input.country_code,
      city_id: input.city_id ?? null,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      notes: input.notes ?? null,
      budget: input.budget ?? null,
      budget_currency: input.budget_currency ?? null,
    };
    set(s => ({ visits: [visit, ...s.visits] }));
    return visit;
  },
  deleteVisit: async id => {
    await repoDelete(id);
    set(s => ({ visits: s.visits.filter(v => v.id !== id) }));
  },
}));
```

- [ ] **Step 5: `useMediaStore.ts`**

```ts
// TravelStat/src/store/useMediaStore.ts
import { create } from 'zustand';
import { listMedia, insertMedia, deleteMediaRow } from '@/database/repositories/media';
import type { Media, CityId, MediaType } from '@/utils/types';

interface State {
  byCity: Map<CityId, Media[]>;
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  addMedia: (cityId: CityId, filePath: string, type: MediaType) => Promise<Media>;
  deleteMedia: (id: number) => Promise<void>;
}

function group(rows: Media[]): Map<CityId, Media[]> {
  const m = new Map<CityId, Media[]>();
  for (const r of rows) {
    const arr = m.get(r.city_id) ?? [];
    arr.push(r);
    m.set(r.city_id, arr);
  }
  return m;
}

export const useMediaStore = create<State>((set, get) => ({
  byCity: new Map(),
  loaded: false,
  loadFromDb: async () => set({ byCity: group(await listMedia()), loaded: true }),
  addMedia: async (cityId, filePath, type) => {
    const id = await insertMedia(cityId, filePath, type);
    const m: Media = { id, city_id: cityId, file_path: filePath, type, created_at: new Date().toISOString() };
    set(s => {
      const next = new Map(s.byCity);
      next.set(cityId, [m, ...(next.get(cityId) ?? [])]);
      return { byCity: next };
    });
    return m;
  },
  deleteMedia: async id => {
    await deleteMediaRow(id);
    set(s => {
      const next = new Map<CityId, Media[]>();
      for (const [cid, arr] of s.byCity) {
        const filtered = arr.filter(m => m.id !== id);
        if (filtered.length) next.set(cid, filtered);
      }
      return { byCity: next };
    });
  },
}));
```

- [ ] **Step 6: `useAchievementsStore.ts`**

```ts
// TravelStat/src/store/useAchievementsStore.ts
import { create } from 'zustand';
import { listAchievements, unlockAchievement } from '@/database/repositories/achievements';
import { ACHIEVEMENTS } from '@/services/achievements';
import type { AchievementDef, AchievementState } from '@/utils/types';

interface State {
  definitions: AchievementDef[];
  byId: Record<string, AchievementState>;
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  unlock: (id: string) => Promise<void>;
}

export const useAchievementsStore = create<State>(set => ({
  definitions: ACHIEVEMENTS,
  byId: {},
  loaded: false,
  loadFromDb: async () => {
    const rows = await listAchievements();
    const byId: Record<string, AchievementState> = {};
    for (const r of rows) byId[r.id] = r;
    set({ byId, loaded: true });
  },
  unlock: async id => {
    await unlockAchievement(id);
    set(s => ({
      byId: { ...s.byId, [id]: { id, unlocked: true, unlocked_at: new Date().toISOString() } },
    }));
  },
}));
```

- [ ] **Step 7: `useSettingsStore.ts`**

```ts
// TravelStat/src/store/useSettingsStore.ts
import { create } from 'zustand';
import { getMeta, setMeta } from '@/database/repositories/meta';

interface State {
  baseCurrency: string;
  loaded: boolean;
  loadFromDb: () => Promise<void>;
  setBaseCurrency: (code: string) => Promise<void>;
}

export const useSettingsStore = create<State>(set => ({
  baseCurrency: 'USD',
  loaded: false,
  loadFromDb: async () => {
    const v = await getMeta('base_currency');
    set({ baseCurrency: v ?? 'USD', loaded: true });
  },
  setBaseCurrency: async code => {
    await setMeta('base_currency', code);
    set({ baseCurrency: code });
  },
}));
```

- [ ] **Step 8: Commit**

```bash
git add TravelStat/src/store/ TravelStat/src/utils/geojson.d.ts TravelStat/metro.config.js
git commit -m "feat(store): six zustand stores loading from sqlite"
```

---

### Task 2.7: Wire app initialization + temporary debug screen

**Files:**
- Modify: `TravelStat/App.tsx`
- Create: `TravelStat/src/screens/DebugScreen.tsx`
- Modify: `TravelStat/src/navigation/RootDrawer.tsx` (add Debug route temporarily)

- [ ] **Step 1: Init flow in `App.tsx`**

```tsx
// TravelStat/App.tsx
import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootDrawer from '@/navigation/RootDrawer';
import { runMigrations } from '@/database/migrations';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useMediaStore } from '@/store/useMediaStore';
import { useAchievementsStore } from '@/store/useAchievementsStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await runMigrations();
        await Promise.all([
          useCountriesStore.getState().loadFromDb(),
          useCitiesStore.getState().loadFromDb(),
          useVisitsStore.getState().loadFromDb(),
          useMediaStore.getState().loadFromDb(),
          useAchievementsStore.getState().loadFromDb(),
          useSettingsStore.getState().loadFromDb(),
        ]);
        setReady(true);
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    })();
  }, []);

  if (error) return <View style={{ flex: 1, padding: 24 }}><Text>DB error: {error}</Text></View>;
  if (!ready)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={MD3LightTheme}>
          <NavigationContainer>
            <RootDrawer />
          </NavigationContainer>
          <StatusBar style="auto" />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Debug screen**

```tsx
// TravelStat/src/screens/DebugScreen.tsx
import { ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useAchievementsStore } from '@/store/useAchievementsStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function DebugScreen() {
  const countries = useCountriesStore(s => s.byCode);
  const cities = useCitiesStore(s => s.all);
  const ach = useAchievementsStore(s => s.byId);
  const visits = useVisitsStore(s => s.visits);
  const cur = useSettingsStore(s => s.baseCurrency);

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text>Countries seeded: {Object.keys(countries).length}</Text>
      <Text>Cities seeded: {cities.length}</Text>
      <Text>Achievements: {Object.keys(ach).length}</Text>
      <Text>Visits: {visits.length}</Text>
      <Text>Base currency: {cur}</Text>
    </ScrollView>
  );
}
```

- [ ] **Step 3: Add Debug route to drawer**

In `TravelStat/src/navigation/RootDrawer.tsx`, add an import and a `<Drawer.Screen>`:

```tsx
import DebugScreen from '@/screens/DebugScreen';
// ...
<Drawer.Screen name="Debug" component={DebugScreen} options={{ drawerIcon: icon('bug') }} />
```

- [ ] **Step 4: Typecheck**

```bash
cd TravelStat
npx tsc --noEmit
```

Must pass.

- [ ] **Step 5: Run on device, verify gate**

```bash
npx expo start --tunnel
```

On Expo Go: open drawer → tap "Debug". Expected:

```
Countries seeded: 195 (or 196)
Cities seeded: ~4000
Achievements: 5
Visits: 0
Base currency: USD
```

- [ ] **Step 6: Commit**

```bash
git add TravelStat/App.tsx TravelStat/src/screens/DebugScreen.tsx TravelStat/src/navigation/RootDrawer.tsx
git commit -m "feat: app init runs migrations and loads stores; debug screen"
```

---

### Task 2.8: Cut Iteration 2 release

- [ ] **Step 1: Gates**

```bash
cd TravelStat
npx tsc --noEmit && npm test
```

- [ ] **Step 2: Build APK and release**

```bash
eas build --platform android --profile preview --non-interactive
```

Tag, push, create GitHub Release `v0.2.0` titled "Iteration 2: Database", attach APK.

```bash
cd C:\Users\User\Desktop\тре
git tag v0.2.0 -m "Iteration 2: database"
git push origin main --tags
```

---

# Iteration 3 — Map engine

Render the world map with all country polygons (transparent fill, gray stroke). Zoom, pan, pinch must work.

**Validation gate:** Map screen opens at initialRegion, 195 polygons visible, pinch zoom changes scale, no crash.

### Task 3.1: Color palette and viewport helpers

**Files:**
- Create: `TravelStat/src/map/colors.ts`
- Create: `TravelStat/src/map/viewport.ts`
- Create: `TravelStat/src/map/viewport.test.ts`

- [ ] **Step 1: `colors.ts`**

```ts
// TravelStat/src/map/colors.ts
export const POLYGON_VISITED   = 'rgba(52,199,89,0.35)';
export const POLYGON_WISHLIST  = 'rgba(10,132,255,0.30)';
export const POLYGON_DEFAULT   = 'rgba(0,0,0,0)';
export const POLYGON_STROKE    = 'rgba(80,80,80,0.6)';
export const POLYGON_STROKE_W  = 0.5;
export type PinColor = 'red' | 'gold' | 'default';
```

- [ ] **Step 2: `viewport.ts` (pure helpers)**

```ts
// TravelStat/src/map/viewport.ts
import type { City, CityId } from '@/utils/types';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface BBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const CITY_VISIBLE_DELTA = 30;
export const MAX_CITY_MARKERS = 300;

export function regionToBbox(r: Region): BBox {
  return {
    minLat: r.latitude - r.latitudeDelta / 2,
    maxLat: r.latitude + r.latitudeDelta / 2,
    minLng: r.longitude - r.longitudeDelta / 2,
    maxLng: r.longitude + r.longitudeDelta / 2,
  };
}

export function inBbox(c: { lat: number; lng: number }, b: BBox): boolean {
  return c.lat >= b.minLat && c.lat <= b.maxLat && c.lng >= b.minLng && c.lng <= b.maxLng;
}

export function visibleCities(
  all: City[],
  region: Region,
  visited: Set<CityId>,
  withMedia: Set<CityId>,
): City[] {
  if (region.latitudeDelta >= CITY_VISIBLE_DELTA) return [];
  const bbox = regionToBbox(region);
  const inView = all.filter(c => inBbox(c, bbox));
  if (inView.length <= MAX_CITY_MARKERS) return inView;
  return inView
    .map(c => ({
      c,
      rank: visited.has(c.id) ? 0 : withMedia.has(c.id) ? 1 : 2 - c.population / 1e9,
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, MAX_CITY_MARKERS)
    .map(x => x.c);
}
```

- [ ] **Step 3: Test**

```ts
// TravelStat/src/map/viewport.test.ts
import { visibleCities, regionToBbox, inBbox } from './viewport';
import type { City } from '@/utils/types';

const mk = (id: number, lat: number, lng: number, pop = 1_000_000): City => ({
  id, lat, lng, name: `c${id}`, country: 'XX', population: pop,
});

test('hides all cities when latitudeDelta >= 30', () => {
  const r = { latitude: 0, longitude: 0, latitudeDelta: 30, longitudeDelta: 30 };
  expect(visibleCities([mk(1, 0, 0)], r, new Set(), new Set())).toEqual([]);
});

test('caps at 300 markers, ranking visited first', () => {
  const cities: City[] = [];
  for (let i = 0; i < 500; i++) cities.push(mk(i, 0, 0, 1_000_000 - i));
  const visited = new Set<number>([499]);
  const r = { latitude: 0, longitude: 0, latitudeDelta: 1, longitudeDelta: 1 };
  const out = visibleCities(cities, r, visited, new Set());
  expect(out).toHaveLength(300);
  expect(out[0].id).toBe(499); // visited bubbled to top
});

test('bbox filters out points outside region', () => {
  const r = { latitude: 0, longitude: 0, latitudeDelta: 10, longitudeDelta: 10 };
  const b = regionToBbox(r);
  expect(inBbox({ lat: 4, lng: 4 }, b)).toBe(true);
  expect(inBbox({ lat: 6, lng: 0 }, b)).toBe(false);
});
```

- [ ] **Step 4: Run tests**

```bash
cd TravelStat
npm test -- viewport
```

Expected: 3 pass.

- [ ] **Step 5: Commit**

```bash
git add TravelStat/src/map/colors.ts TravelStat/src/map/viewport.ts TravelStat/src/map/viewport.test.ts
git commit -m "feat(map): viewport helpers and color palette with tests"
```

---

### Task 3.2: CountryLayer + WorldMap

**Files:**
- Create: `TravelStat/src/map/CountryLayer.tsx`
- Create: `TravelStat/src/map/WorldMap.tsx`
- Create: `TravelStat/src/map/useViewport.ts`
- Modify: `TravelStat/src/screens/MapScreen.tsx`

- [ ] **Step 1: `useViewport.ts`**

```ts
// TravelStat/src/map/useViewport.ts
import { useRef, useState, useCallback } from 'react';
import type MapView from 'react-native-maps';
import type { Region } from './viewport';

const INITIAL: Region = { latitude: 20, longitude: 0, latitudeDelta: 100, longitudeDelta: 100 };

export function useViewport() {
  const [region, setRegion] = useState<Region>(INITIAL);
  const mapRef = useRef<MapView | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onRegionChangeComplete = useCallback((r: Region) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setRegion(r), 150);
  }, []);

  const flyTo = useCallback((lat: number, lng: number, delta = 5) => {
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta },
      400,
    );
  }, []);

  return { region, mapRef, onRegionChangeComplete, flyTo, initial: INITIAL };
}
```

- [ ] **Step 2: `CountryLayer.tsx`**

```tsx
// TravelStat/src/map/CountryLayer.tsx
import { memo, useMemo } from 'react';
import { Polygon } from 'react-native-maps';
import type { Feature, MultiPolygon, Polygon as GeoPolygon } from 'geojson';
import { useCountriesStore } from '@/store/useCountriesStore';
import {
  POLYGON_DEFAULT, POLYGON_STROKE, POLYGON_STROKE_W, POLYGON_VISITED, POLYGON_WISHLIST,
} from './colors';
import type { IsoCode } from '@/utils/types';

interface Ring { iso: IsoCode; coords: { latitude: number; longitude: number }[]; }

function flattenFeature(f: Feature): Ring[] {
  const iso: IsoCode =
    (f.properties as any)?.ISO_A2_EH ??
    (f.properties as any)?.ISO_A2 ??
    '';
  if (!iso || iso === '-99') return [];

  const out: Ring[] = [];
  const push = (rings: number[][][]) => {
    for (const ring of rings) {
      out.push({
        iso,
        coords: ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      });
    }
  };

  if (f.geometry.type === 'Polygon') {
    push((f.geometry as GeoPolygon).coordinates);
  } else if (f.geometry.type === 'MultiPolygon') {
    for (const poly of (f.geometry as MultiPolygon).coordinates) push(poly);
  }
  return out;
}

interface PolyProps {
  ring: Ring;
  visited: boolean;
  wishlist: boolean;
  onPress: (iso: IsoCode) => void;
}

const CountryPolygon = memo(function CountryPolygon({ ring, visited, wishlist, onPress }: PolyProps) {
  const fill = visited ? POLYGON_VISITED : wishlist ? POLYGON_WISHLIST : POLYGON_DEFAULT;
  return (
    <Polygon
      coordinates={ring.coords}
      fillColor={fill}
      strokeColor={POLYGON_STROKE}
      strokeWidth={POLYGON_STROKE_W}
      tappable
      onPress={() => onPress(ring.iso)}
    />
  );
});

interface Props {
  onCountryPress: (iso: IsoCode) => void;
}

export default function CountryLayer({ onCountryPress }: Props) {
  const geojson = useCountriesStore(s => s.geojson);
  const visited = useCountriesStore(s => s.visited);
  const wishlist = useCountriesStore(s => s.wishlist);

  const rings = useMemo<Ring[]>(() => {
    const all: Ring[] = [];
    for (const f of (geojson?.features ?? []) as Feature[]) all.push(...flattenFeature(f));
    return all;
  }, [geojson]);

  return (
    <>
      {rings.map((r, i) => (
        <CountryPolygon
          key={`${r.iso}-${i}`}
          ring={r}
          visited={visited.has(r.iso)}
          wishlist={wishlist.has(r.iso)}
          onPress={onCountryPress}
        />
      ))}
    </>
  );
}
```

- [ ] **Step 3: `WorldMap.tsx`**

```tsx
// TravelStat/src/map/WorldMap.tsx
import { Platform, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useViewport } from './useViewport';
import CountryLayer from './CountryLayer';
import type { IsoCode } from '@/utils/types';

interface Props {
  onCountryPress: (iso: IsoCode) => void;
}

export default function WorldMap({ onCountryPress }: Props) {
  const { initial, mapRef, onRegionChangeComplete } = useViewport();
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={initial}
      onRegionChangeComplete={onRegionChangeComplete}
      pitchEnabled={false}
      rotateEnabled={false}
      showsBuildings={false}
    >
      <CountryLayer onCountryPress={onCountryPress} />
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
```

- [ ] **Step 4: `MapScreen.tsx`**

```tsx
// TravelStat/src/screens/MapScreen.tsx
import WorldMap from '@/map/WorldMap';

export default function MapScreen() {
  return <WorldMap onCountryPress={(iso) => console.log('tapped country', iso)} />;
}
```

- [ ] **Step 5: Typecheck**

```bash
cd TravelStat
npx tsc --noEmit
```

- [ ] **Step 6: Run on device, verify gate**

```bash
npx expo start --tunnel
```

Open drawer → Map. Expected: world map appears, 195 country outlines drawn. Pinch zooms. Pan pans. Tapping a country logs the ISO code to Metro logs.

- [ ] **Step 7: Commit**

```bash
git add TravelStat/src/map/ TravelStat/src/screens/MapScreen.tsx
git commit -m "feat(map): world map with country polygons"
```

---

### Task 3.3: Cut Iteration 3 release

```bash
cd TravelStat
npx tsc --noEmit && npm test
eas build --platform android --profile preview --non-interactive
```

```bash
cd C:\Users\User\Desktop\тре
git tag v0.3.0 -m "Iteration 3: map engine"
git push origin main --tags
```

GitHub Release `v0.3.0` "Iteration 3: Map Engine" + attach APK.

---

# Iteration 4 — Visited countries

Tap a country polygon → mark visited → green fill, persisted. Home screen shows count.

**Validation gate:** Tap Mexico → polygon turns green → reload app → still green → Home shows "1 / 195".

### Task 4.1: Coordinator service

**Files:**
- Create: `TravelStat/src/services/coordinator.ts`

- [ ] **Step 1: Write the coordinator**

```ts
// TravelStat/src/services/coordinator.ts
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import type { IsoCode, CityId, NewVisit } from '@/utils/types';

export async function markCountryVisited(iso: IsoCode): Promise<void> {
  await useCountriesStore.getState().toggleVisited(iso);
  // achievements will be added in Iteration 10
}

export async function markCityVisited(id: CityId): Promise<void> {
  await useCitiesStore.getState().toggleVisited(id);
}

export async function recordVisit(input: NewVisit): Promise<void> {
  await useVisitsStore.getState().addVisit(input);
  // also mark country/city visited
  if (!useCountriesStore.getState().visited.has(input.country_code)) {
    await useCountriesStore.getState().toggleVisited(input.country_code);
  }
  if (input.city_id && !useCitiesStore.getState().visited.has(input.city_id)) {
    await useCitiesStore.getState().toggleVisited(input.city_id);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add TravelStat/src/services/coordinator.ts
git commit -m "feat(services): coordinator for cross-store mutations"
```

---

### Task 4.2: Wire MapScreen → coordinator

**Files:**
- Modify: `TravelStat/src/screens/MapScreen.tsx`

- [ ] **Step 1: Replace the console.log with the action**

```tsx
// TravelStat/src/screens/MapScreen.tsx
import { useState } from 'react';
import { View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import WorldMap from '@/map/WorldMap';
import { useCountriesStore } from '@/store/useCountriesStore';
import { markCountryVisited } from '@/services/coordinator';
import type { IsoCode } from '@/utils/types';

export default function MapScreen() {
  const [msg, setMsg] = useState<string | null>(null);
  const byCode = useCountriesStore(s => s.byCode);

  const onCountryPress = async (iso: IsoCode) => {
    await markCountryVisited(iso);
    const name = byCode[iso]?.name ?? iso;
    const visited = useCountriesStore.getState().visited.has(iso);
    setMsg(visited ? `Marked ${name} visited ✓` : `Unmarked ${name}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <WorldMap onCountryPress={onCountryPress} />
      <Snackbar visible={!!msg} onDismiss={() => setMsg(null)} duration={1800}>{msg ?? ''}</Snackbar>
    </View>
  );
}
```

- [ ] **Step 2: Run on device, verify gate**

Tap Mexico → polygon turns green → snackbar "Marked Mexico visited ✓". Reload (`r` in Metro) → fill still green.

- [ ] **Step 3: Commit**

```bash
git add TravelStat/src/screens/MapScreen.tsx
git commit -m "feat(map): tap country to toggle visited"
```

---

### Task 4.3: Home screen with stats tiles

**Files:**
- Create: `TravelStat/src/components/StatCard.tsx`
- Modify: `TravelStat/src/screens/HomeScreen.tsx`

- [ ] **Step 1: `StatCard.tsx`**

```tsx
// TravelStat/src/components/StatCard.tsx
import { View } from 'react-native';
import { Card, Text, ProgressBar } from 'react-native-paper';

interface Props {
  label: string;
  value: string;
  progress?: number; // 0..1
}

export default function StatCard({ label, value, progress }: Props) {
  return (
    <Card style={{ flex: 1, margin: 6 }}>
      <Card.Content>
        <Text variant="labelMedium">{label}</Text>
        <Text variant="headlineSmall" style={{ marginTop: 4 }}>{value}</Text>
        {progress != null && (
          <ProgressBar progress={Math.max(0, Math.min(1, progress))} style={{ marginTop: 8 }} />
        )}
      </Card.Content>
    </Card>
  );
}
```

- [ ] **Step 2: `HomeScreen.tsx`**

```tsx
// TravelStat/src/screens/HomeScreen.tsx
import { ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';
import StatCard from '@/components/StatCard';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';

export default function HomeScreen() {
  const countriesByCode = useCountriesStore(s => s.byCode);
  const visitedCountries = useCountriesStore(s => s.visited);
  const wishlistCountries = useCountriesStore(s => s.wishlist);
  const visitedCities = useCitiesStore(s => s.visited);

  const totalCountries = Object.keys(countriesByCode).length;
  const continentSet = new Set<string>();
  for (const iso of visitedCountries) {
    const c = countriesByCode[iso];
    if (c) continentSet.add(c.continent);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 8 }}>
      <Text variant="headlineMedium" style={{ marginHorizontal: 8, marginVertical: 12 }}>TravelStat ✈️</Text>
      <View style={{ flexDirection: 'row' }}>
        <StatCard label="Countries" value={`${visitedCountries.size} / ${totalCountries}`} progress={visitedCountries.size / totalCountries} />
        <StatCard label="Cities" value={`${visitedCities.size}`} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <StatCard label="Continents" value={`${continentSet.size} / 7`} progress={continentSet.size / 7} />
        <StatCard label="Wishlist" value={`${wishlistCountries.size}`} />
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 3: Verify**

On device: Home tile "Countries: 1 / 195" after marking Mexico.

- [ ] **Step 4: Commit**

```bash
git add TravelStat/src/components/StatCard.tsx TravelStat/src/screens/HomeScreen.tsx
git commit -m "feat(home): stat tiles for countries/cities/continents/wishlist"
```

---

### Task 4.4: Cut Iteration 4 release

```bash
cd TravelStat
npx tsc --noEmit && npm test
eas build --platform android --profile preview --non-interactive
```

```bash
cd C:\Users\User\Desktop\тре
git tag v0.4.0 -m "Iteration 4: visited countries"
git push origin main --tags
```

GitHub Release `v0.4.0` "Iteration 4: Visited Countries" + APK.

---

# Iteration 5 — City system

Render city markers at zoom levels < 30° latitudeDelta, capped at 300, with viewport filter. Tap a marker → CityDetailScreen with "mark visited" toggle.

**Validation gate:** At country-level zoom, markers appear; total ≤ 300; tap city → detail; mark visited → pin turns red; reload preserves it.

### Task 5.1: CityLayer

**Files:**
- Create: `TravelStat/src/map/CityLayer.tsx`
- Modify: `TravelStat/src/map/WorldMap.tsx`

- [ ] **Step 1: `CityLayer.tsx`**

```tsx
// TravelStat/src/map/CityLayer.tsx
import { useMemo } from 'react';
import { Marker } from 'react-native-maps';
import { useCitiesStore } from '@/store/useCitiesStore';
import { visibleCities, type Region } from './viewport';
import type { CityId } from '@/utils/types';

interface Props {
  region: Region;
  onCityPress: (id: CityId) => void;
}

export default function CityLayer({ region, onCityPress }: Props) {
  const all = useCitiesStore(s => s.all);
  const visited = useCitiesStore(s => s.visited);
  const withMedia = useCitiesStore(s => s.withMedia);

  const cities = useMemo(
    () => visibleCities(all, region, visited, withMedia),
    [all, region, visited, withMedia],
  );

  return (
    <>
      {cities.map(c => (
        <Marker
          key={c.id}
          coordinate={{ latitude: c.lat, longitude: c.lng }}
          title={c.name}
          pinColor={visited.has(c.id) ? 'red' : withMedia.has(c.id) ? 'gold' : undefined}
          onPress={() => onCityPress(c.id)}
        />
      ))}
    </>
  );
}
```

- [ ] **Step 2: Update `WorldMap.tsx` to render CityLayer when zoomed in**

```tsx
// TravelStat/src/map/WorldMap.tsx
import { Platform, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useViewport } from './useViewport';
import CountryLayer from './CountryLayer';
import CityLayer from './CityLayer';
import { CITY_VISIBLE_DELTA } from './viewport';
import type { IsoCode, CityId } from '@/utils/types';

interface Props {
  onCountryPress: (iso: IsoCode) => void;
  onCityPress: (id: CityId) => void;
}

export default function WorldMap({ onCountryPress, onCityPress }: Props) {
  const { initial, mapRef, region, onRegionChangeComplete } = useViewport();
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={initial}
      onRegionChangeComplete={onRegionChangeComplete}
      pitchEnabled={false}
      rotateEnabled={false}
      showsBuildings={false}
    >
      <CountryLayer onCountryPress={onCountryPress} />
      {region.latitudeDelta < CITY_VISIBLE_DELTA && (
        <CityLayer region={region} onCityPress={onCityPress} />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
```

- [ ] **Step 3: Commit**

```bash
git add TravelStat/src/map/CityLayer.tsx TravelStat/src/map/WorldMap.tsx
git commit -m "feat(map): viewport-filtered city markers"
```

---

### Task 5.2: CityDetailScreen + navigation stack

**Files:**
- Create: `TravelStat/src/screens/CityDetailScreen.tsx`
- Create: `TravelStat/src/navigation/MapStack.tsx`
- Modify: `TravelStat/src/navigation/RootDrawer.tsx`
- Modify: `TravelStat/src/screens/MapScreen.tsx`

- [ ] **Step 1: `CityDetailScreen.tsx`**

```tsx
// TravelStat/src/screens/CityDetailScreen.tsx
import { View, StyleSheet } from 'react-native';
import { Button, Text, Switch } from 'react-native-paper';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useCountriesStore } from '@/store/useCountriesStore';
import { markCityVisited } from '@/services/coordinator';
import type { RouteProp } from '@react-navigation/native';
import type { CityId } from '@/utils/types';

export type CityDetailParams = { id: CityId };

interface Props {
  route: RouteProp<{ CityDetail: CityDetailParams }, 'CityDetail'>;
}

export default function CityDetailScreen({ route }: Props) {
  const { id } = route.params;
  const city = useCitiesStore(s => s.byId.get(id));
  const visited = useCitiesStore(s => s.visited.has(id));
  const country = useCountriesStore(s => (city ? s.byCode[city.country] : undefined));

  if (!city) return <View style={s.empty}><Text>City not found</Text></View>;

  return (
    <View style={s.root}>
      <Text variant="headlineMedium">{city.name}</Text>
      <Text variant="bodyMedium" style={{ marginTop: 4 }}>
        {country?.flag} {country?.name ?? city.country} · pop ~{Math.round(city.population / 1000)}k
      </Text>
      <View style={s.row}>
        <Text>Visited</Text>
        <Switch value={visited} onValueChange={() => markCityVisited(id)} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, padding: 24 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 },
});
```

- [ ] **Step 2: `MapStack.tsx`**

```tsx
// TravelStat/src/navigation/MapStack.tsx
import { createStackNavigator } from '@react-navigation/stack';
import MapScreen from '@/screens/MapScreen';
import CityDetailScreen, { type CityDetailParams } from '@/screens/CityDetailScreen';

export type MapStackParamList = {
  Map: undefined;
  CityDetail: CityDetailParams;
};

const Stack = createStackNavigator<MapStackParamList>();

export default function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CityDetail" component={CityDetailScreen} options={{ title: 'City' }} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 3: Swap MapScreen → MapStack in RootDrawer**

```tsx
// TravelStat/src/navigation/RootDrawer.tsx
// replace the Map drawer screen:
import MapStack from '@/navigation/MapStack';
// ...
<Drawer.Screen name="Map" component={MapStack} options={{ drawerIcon: icon('map') }} />
```

- [ ] **Step 4: Update `MapScreen.tsx` to navigate**

```tsx
// TravelStat/src/screens/MapScreen.tsx
import { useState } from 'react';
import { View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import WorldMap from '@/map/WorldMap';
import { useCountriesStore } from '@/store/useCountriesStore';
import { markCountryVisited } from '@/services/coordinator';
import type { IsoCode, CityId } from '@/utils/types';
import type { MapStackParamList } from '@/navigation/MapStack';

type Nav = StackNavigationProp<MapStackParamList, 'Map'>;

export default function MapScreen() {
  const [msg, setMsg] = useState<string | null>(null);
  const byCode = useCountriesStore(s => s.byCode);
  const nav = useNavigation<Nav>();

  const onCountryPress = async (iso: IsoCode) => {
    await markCountryVisited(iso);
    const name = byCode[iso]?.name ?? iso;
    const visited = useCountriesStore.getState().visited.has(iso);
    setMsg(visited ? `Marked ${name} visited ✓` : `Unmarked ${name}`);
  };

  const onCityPress = (id: CityId) => nav.navigate('CityDetail', { id });

  return (
    <View style={{ flex: 1 }}>
      <WorldMap onCountryPress={onCountryPress} onCityPress={onCityPress} />
      <Snackbar visible={!!msg} onDismiss={() => setMsg(null)} duration={1800}>{msg ?? ''}</Snackbar>
    </View>
  );
}
```

- [ ] **Step 5: Run on device, verify gate**

Zoom in to country level → city markers appear (max 300). Tap one → CityDetail. Toggle "Visited" → reload Map → pin red.

- [ ] **Step 6: Commit**

```bash
git add TravelStat/src/screens/CityDetailScreen.tsx TravelStat/src/navigation/ TravelStat/src/screens/MapScreen.tsx
git commit -m "feat(cities): markers, detail screen, mark-visited"
```

---

### Task 5.3: Cut Iteration 5 release

```bash
cd TravelStat
npx tsc --noEmit && npm test
eas build --platform android --profile preview --non-interactive
```

```bash
cd C:\Users\User\Desktop\тре
git tag v0.5.0 -m "Iteration 5: city system"
git push origin main --tags
```

GitHub Release `v0.5.0` + APK.

---

# Iteration 6 — Wishlist

Wishlist screen + search-based country add + "jump to map" + blue polygon overlay.

**Validation gate:** Add country to wishlist via search → polygon turns blue → wishlist screen lists it → "Jump to map" centers on it.

### Task 6.1: Country search service

**Files:**
- Create: `TravelStat/src/services/search.ts`

- [ ] **Step 1: Write the file**

```ts
// TravelStat/src/services/search.ts
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import type { CountryMeta, City } from '@/utils/types';

export type SearchResult =
  | { kind: 'country'; item: CountryMeta }
  | { kind: 'city';    item: City };

export function search(query: string, limit = 20): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const out: SearchResult[] = [];
  const countries = Object.values(useCountriesStore.getState().byCode) as CountryMeta[];
  for (const c of countries) {
    if (c.name.toLowerCase().includes(q)) out.push({ kind: 'country', item: c });
    if (out.length >= limit) return rank(out, q);
  }

  const cities = useCitiesStore.getState().all;
  for (const c of cities) {
    if (c.name.toLowerCase().includes(q)) out.push({ kind: 'city', item: c });
    if (out.length >= limit) break;
  }
  return rank(out, q);
}

function rank(items: SearchResult[], q: string): SearchResult[] {
  return items
    .map(r => {
      const name = (r.kind === 'country' ? r.item.name : r.item.name).toLowerCase();
      const score = name === q ? 0 : name.startsWith(q) ? 1 : 2;
      return { r, score };
    })
    .sort((a, b) => a.score - b.score)
    .map(x => x.r);
}
```

- [ ] **Step 2: Commit**

```bash
git add TravelStat/src/services/search.ts
git commit -m "feat(search): local search across countries and cities"
```

---

### Task 6.2: WishlistScreen with search add

**Files:**
- Create: `TravelStat/src/components/CountryListItem.tsx`
- Modify: `TravelStat/src/screens/WishlistScreen.tsx`

- [ ] **Step 1: `CountryListItem.tsx`**

```tsx
// TravelStat/src/components/CountryListItem.tsx
import { List } from 'react-native-paper';
import type { CountryMeta } from '@/utils/types';

interface Props {
  country: CountryMeta;
  onPress?: () => void;
  right?: React.ReactNode;
}

export default function CountryListItem({ country, onPress, right }: Props) {
  return (
    <List.Item
      title={`${country.flag} ${country.name}`}
      description={country.continent}
      onPress={onPress}
      right={() => right ?? null}
    />
  );
}
```

- [ ] **Step 2: `WishlistScreen.tsx`**

```tsx
// TravelStat/src/screens/WishlistScreen.tsx
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Searchbar, IconButton, Divider, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import CountryListItem from '@/components/CountryListItem';
import { useCountriesStore } from '@/store/useCountriesStore';
import { search } from '@/services/search';

export default function WishlistScreen() {
  const [query, setQuery] = useState('');
  const byCode = useCountriesStore(s => s.byCode);
  const wishlist = useCountriesStore(s => s.wishlist);
  const toggleWishlist = useCountriesStore(s => s.toggleWishlist);
  const nav = useNavigation();

  const results = useMemo(() => {
    if (!query) return [];
    return search(query, 10).filter(r => r.kind === 'country');
  }, [query]);

  const wishlistArr = useMemo(
    () => Array.from(wishlist).map(iso => byCode[iso]).filter(Boolean),
    [wishlist, byCode],
  );

  return (
    <View style={{ flex: 1 }}>
      <Searchbar placeholder="Add country to wishlist…" value={query} onChangeText={setQuery} style={{ margin: 8 }} />
      {results.length > 0 && (
        <View style={{ maxHeight: 220 }}>
          {results.map(r => {
            if (r.kind !== 'country') return null;
            const c = r.item;
            const inList = wishlist.has(c.iso_code);
            return (
              <CountryListItem
                key={c.iso_code}
                country={c}
                onPress={async () => {
                  await toggleWishlist(c.iso_code);
                  setQuery('');
                }}
                right={<Text>{inList ? '✓' : '+'}</Text>}
              />
            );
          })}
          <Divider />
        </View>
      )}
      <FlatList
        data={wishlistArr}
        keyExtractor={c => c.iso_code}
        ListHeaderComponent={<Text variant="titleMedium" style={{ margin: 12 }}>Your wishlist ({wishlistArr.length})</Text>}
        renderItem={({ item }) => (
          <CountryListItem
            country={item}
            right={
              <View style={{ flexDirection: 'row' }}>
                <IconButton icon="map-marker-outline" onPress={() => nav.dispatch(DrawerActions.jumpTo('Map'))} />
                <IconButton icon="close" onPress={() => toggleWishlist(item.iso_code)} />
              </View>
            }
          />
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, opacity: 0.6 }}>No wishlist yet</Text>}
      />
    </View>
  );
}
```

- [ ] **Step 3: Run on device, verify gate**

Type "Jap" in wishlist search → "Japan" appears → tap to add. Open Map → Japan polygon now has blue fill. Back to Wishlist → Japan listed with map-jump button.

- [ ] **Step 4: Commit**

```bash
git add TravelStat/src/components/CountryListItem.tsx TravelStat/src/screens/WishlistScreen.tsx
git commit -m "feat(wishlist): search-add, list, jump-to-map, blue overlay"
```

---

### Task 6.3: Cut Iteration 6 release

```bash
cd TravelStat
npx tsc --noEmit && npm test
eas build --platform android --profile preview --non-interactive
```

```bash
cd C:\Users\User\Desktop\тре
git tag v0.6.0 -m "Iteration 6: wishlist"
git push origin main --tags
```

GitHub Release `v0.6.0` + APK.

---

# Iteration 7 — Timeline + budget

Add-visit form, timeline list, budget field (with current base-currency chip), home "Avg / day" tile.

**Validation gate:** Add a visit with budget → appears at top of timeline → country auto-marked → Home "Avg / day" tile updates → reload persists everything.

### Task 7.1: Date and currency helpers

**Files:**
- Create: `TravelStat/src/utils/dates.ts`
- Create: `TravelStat/src/utils/currency.ts`
- Create: `TravelStat/src/utils/currency.test.ts`

- [ ] **Step 1: `dates.ts`**

```ts
// TravelStat/src/utils/dates.ts
import { differenceInCalendarDays, format, parseISO } from 'date-fns';

export function visitDays(start: string, end: string | null): number {
  if (!end) return 1;
  return Math.max(1, differenceInCalendarDays(parseISO(end), parseISO(start)) + 1);
}

export function fmtDate(iso: string): string {
  return format(parseISO(iso), 'PP');
}

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
```

- [ ] **Step 2: `currency.ts`**

```ts
// TravelStat/src/utils/currency.ts
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'IDR', 'MYR', 'BRL', 'MXN'] as const;
export type CurrencyCode = typeof CURRENCIES[number];

const SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', IDR: 'Rp', MYR: 'RM', BRL: 'R$', MXN: 'MX$',
};

export function symbol(code: string): string {
  return (SYMBOLS as Record<string, string>)[code] ?? code + ' ';
}

export function fmtMoney(amount: number, code: string): string {
  const sym = symbol(code);
  const rounded = Math.abs(amount) >= 1000 ? Math.round(amount).toLocaleString() : amount.toFixed(0);
  return `${sym}${rounded}`;
}

export function averagePerDay(budget: number, days: number): number {
  if (days <= 0) return 0;
  return budget / days;
}
```

- [ ] **Step 3: `currency.test.ts`**

```ts
// TravelStat/src/utils/currency.test.ts
import { fmtMoney, averagePerDay } from './currency';

test('fmtMoney formats USD', () => expect(fmtMoney(1400, 'USD')).toBe('$1,400'));
test('fmtMoney unknown code falls back to code prefix', () => expect(fmtMoney(50, 'AAA')).toBe('AAA 50'));
test('averagePerDay correct', () => expect(averagePerDay(1400, 10)).toBe(140));
test('averagePerDay handles zero days', () => expect(averagePerDay(1400, 0)).toBe(0));
```

- [ ] **Step 4: Run tests**

```bash
cd TravelStat
npm test -- currency
```

- [ ] **Step 5: Commit**

```bash
git add TravelStat/src/utils/dates.ts TravelStat/src/utils/currency.ts TravelStat/src/utils/currency.test.ts
git commit -m "feat(utils): date and currency helpers with tests"
```

---

### Task 7.2: AddVisitScreen + TimelineScreen

**Files:**
- Create: `TravelStat/src/screens/AddVisitScreen.tsx`
- Modify: `TravelStat/src/screens/TimelineScreen.tsx`
- Create: `TravelStat/src/components/VisitListItem.tsx`
- Modify: `TravelStat/src/navigation/RootDrawer.tsx` (Timeline becomes a stack)
- Create: `TravelStat/src/navigation/TimelineStack.tsx`

- [ ] **Step 1: `TimelineStack.tsx`**

```tsx
// TravelStat/src/navigation/TimelineStack.tsx
import { createStackNavigator } from '@react-navigation/stack';
import TimelineScreen from '@/screens/TimelineScreen';
import AddVisitScreen from '@/screens/AddVisitScreen';

export type TimelineStackParamList = {
  Timeline: undefined;
  AddVisit: undefined;
};

const Stack = createStackNavigator<TimelineStackParamList>();

export default function TimelineStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Timeline" component={TimelineScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddVisit" component={AddVisitScreen} options={{ title: 'Add visit' }} />
    </Stack.Navigator>
  );
}
```

In `RootDrawer.tsx` swap Timeline with TimelineStack:

```tsx
import TimelineStack from '@/navigation/TimelineStack';
// ...
<Drawer.Screen name="Timeline" component={TimelineStack} options={{ drawerIcon: icon('timeline') }} />
```

- [ ] **Step 2: `VisitListItem.tsx`**

```tsx
// TravelStat/src/components/VisitListItem.tsx
import { List, Text } from 'react-native-paper';
import { fmtDate, visitDays } from '@/utils/dates';
import { fmtMoney } from '@/utils/currency';
import type { Visit, CountryMeta } from '@/utils/types';

interface Props {
  visit: Visit;
  country?: CountryMeta;
  cityName?: string;
}

export default function VisitListItem({ visit, country, cityName }: Props) {
  const days = visitDays(visit.start_date, visit.end_date);
  const range = `${fmtDate(visit.start_date)}${visit.end_date ? ` – ${fmtDate(visit.end_date)}` : ''}`;
  const money = visit.budget != null && visit.budget_currency
    ? ` · ${fmtMoney(visit.budget, visit.budget_currency)}`
    : '';
  return (
    <List.Item
      title={`${country?.flag ?? ''} ${country?.name ?? visit.country_code}${cityName ? ` · ${cityName}` : ''}`}
      description={`${range} · ${days}d${money}`}
    />
  );
}
```

- [ ] **Step 3: `TimelineScreen.tsx`**

```tsx
// TravelStat/src/screens/TimelineScreen.tsx
import { FlatList, View } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import VisitListItem from '@/components/VisitListItem';
import type { TimelineStackParamList } from '@/navigation/TimelineStack';

type Nav = StackNavigationProp<TimelineStackParamList, 'Timeline'>;

export default function TimelineScreen() {
  const visits = useVisitsStore(s => s.visits);
  const byCode = useCountriesStore(s => s.byCode);
  const cityById = useCitiesStore(s => s.byId);
  const nav = useNavigation<Nav>();

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={visits}
        keyExtractor={v => String(v.id)}
        renderItem={({ item }) => (
          <VisitListItem
            visit={item}
            country={byCode[item.country_code]}
            cityName={item.city_id ? cityById.get(item.city_id)?.name : undefined}
          />
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 64, opacity: 0.6 }}>No visits yet</Text>}
      />
      <FAB icon="plus" style={{ position: 'absolute', right: 16, bottom: 16 }} onPress={() => nav.navigate('AddVisit')} />
    </View>
  );
}
```

- [ ] **Step 4: `AddVisitScreen.tsx`**

```tsx
// TravelStat/src/screens/AddVisitScreen.tsx
import { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Button, Chip, HelperText, TextInput, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { search } from '@/services/search';
import { recordVisit } from '@/services/coordinator';
import { today } from '@/utils/dates';

export default function AddVisitScreen() {
  const baseCurrency = useSettingsStore(s => s.baseCurrency);
  const byCode = useCountriesStore(s => s.byCode);
  const nav = useNavigation();

  const [countryQuery, setCountryQuery] = useState('');
  const [countryIso, setCountryIso] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const suggestions = useMemo(() => {
    if (!countryQuery || countryIso) return [];
    return search(countryQuery, 5).filter(r => r.kind === 'country').slice(0, 5);
  }, [countryQuery, countryIso]);

  const canSubmit = !!countryIso && !!startDate && !submitting;

  const submit = async () => {
    if (!countryIso) return;
    setSubmitting(true);
    try {
      const b = budget.trim() ? Number(budget.replace(',', '.')) : undefined;
      await recordVisit({
        country_code: countryIso,
        start_date: startDate,
        end_date: endDate || undefined,
        notes: notes || undefined,
        budget: Number.isFinite(b!) ? b : undefined,
        budget_currency: b != null ? baseCurrency : undefined,
      });
      nav.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.root}>
      <Text variant="titleMedium">Country</Text>
      {countryIso ? (
        <Chip onClose={() => setCountryIso(null)} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
          {byCode[countryIso]?.flag} {byCode[countryIso]?.name}
        </Chip>
      ) : (
        <>
          <TextInput value={countryQuery} onChangeText={setCountryQuery} placeholder="Search country…" />
          {suggestions.map(r => r.kind === 'country' && (
            <Button key={r.item.iso_code} onPress={() => setCountryIso(r.item.iso_code)}>
              {r.item.flag} {r.item.name}
            </Button>
          ))}
        </>
      )}

      <Text variant="titleMedium" style={s.label}>Start date</Text>
      <TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />

      <Text variant="titleMedium" style={s.label}>End date (optional)</Text>
      <TextInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />

      <Text variant="titleMedium" style={s.label}>Budget (optional)</Text>
      <View style={s.row}>
        <TextInput value={budget} onChangeText={setBudget} keyboardType="numeric" style={{ flex: 1 }} />
        <Chip style={{ marginLeft: 8 }}>{baseCurrency}</Chip>
      </View>
      <HelperText type="info">Saved in {baseCurrency}.</HelperText>

      <Text variant="titleMedium" style={s.label}>Notes</Text>
      <TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

      <Button mode="contained" onPress={submit} disabled={!canSubmit} style={{ marginTop: 24 }}>
        Save visit
      </Button>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { padding: 16 },
  label: { marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
```

- [ ] **Step 5: Add "Avg / day" tile on Home**

Edit `TravelStat/src/screens/HomeScreen.tsx` — add a new row with a budget tile:

```tsx
import { useVisitsStore } from '@/store/useVisitsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { visitDays } from '@/utils/dates';
import { fmtMoney, averagePerDay } from '@/utils/currency';
```

Inside the component, after existing derivations:

```tsx
const visits = useVisitsStore(s => s.visits);
const baseCurrency = useSettingsStore(s => s.baseCurrency);
const totalDays = visits.reduce((n, v) => n + visitDays(v.start_date, v.end_date), 0);
const sameCurrency = visits.filter(v => v.budget != null && v.budget_currency === baseCurrency);
const sameCurrencyDays = sameCurrency.reduce((n, v) => n + visitDays(v.start_date, v.end_date), 0);
const sameCurrencyBudget = sameCurrency.reduce((n, v) => n + (v.budget ?? 0), 0);
const avgPerDay = averagePerDay(sameCurrencyBudget, sameCurrencyDays);
```

Add the row below the existing 2 rows:

```tsx
<View style={{ flexDirection: 'row' }}>
  <StatCard label="Travel days" value={`${totalDays}`} />
  <StatCard
    label="Avg / day"
    value={sameCurrencyDays > 0 ? fmtMoney(avgPerDay, baseCurrency) : '—'}
  />
</View>
```

- [ ] **Step 6: Run on device, verify gate**

Open Timeline → FAB → fill country "Mexico", start 2026-01-01, end 2026-01-10, budget 1400 → Save. Back on Timeline you see "🇲🇽 Mexico · Jan 1 – Jan 10 · 10d · $1,400". Home → "Travel days: 10", "Avg / day: $140". Mexico polygon green on Map.

- [ ] **Step 7: Commit**

```bash
git add TravelStat/src/screens/AddVisitScreen.tsx TravelStat/src/screens/TimelineScreen.tsx TravelStat/src/screens/HomeScreen.tsx TravelStat/src/components/VisitListItem.tsx TravelStat/src/navigation/TimelineStack.tsx TravelStat/src/navigation/RootDrawer.tsx
git commit -m "feat(timeline): add-visit form, list, budget, avg/day home tile"
```

---

### Task 7.3: Cut Iteration 7 release

```bash
cd TravelStat
npx tsc --noEmit && npm test
eas build --platform android --profile preview --non-interactive
```

```bash
cd C:\Users\User\Desktop\тре
git tag v0.7.0 -m "Iteration 7: timeline + budget"
git push origin main --tags
```

GitHub Release `v0.7.0` + APK.

---

# Iteration 8 — Media

Image / video picker on CityDetailScreen, files copied into `documentDirectory/media/`, gallery grid, gold pin on map for cities with media.

**Validation gate:** Add photo to a city → grid thumbnail → survives app restart → pin gold on map.

### Task 8.1: Media service

**Files:**
- Create: `TravelStat/src/services/media.ts`
- Modify: `TravelStat/src/services/coordinator.ts`

- [ ] **Step 1: `media.ts`**

```ts
// TravelStat/src/services/media.ts
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import uuid from 'react-native-uuid';
import type { MediaType, CityId } from '@/utils/types';

const MEDIA_DIR = FileSystem.documentDirectory + 'media/';

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
}

export async function pickAndCopy(): Promise<{ uri: string; type: MediaType } | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    quality: 0.8,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const type: MediaType = a.type === 'video' ? 'video' : 'photo';
  await ensureDir();
  const ext = a.uri.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
  const dest = MEDIA_DIR + uuid.v4() + '.' + ext;
  await FileSystem.copyAsync({ from: a.uri, to: dest });
  return { uri: dest, type };
}

export async function purgeAllMedia(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (info.exists) await FileSystem.deleteAsync(MEDIA_DIR, { idempotent: true });
}
```

- [ ] **Step 2: Coordinator wiring**

Append to `TravelStat/src/services/coordinator.ts`:

```ts
import { useMediaStore } from '@/store/useMediaStore';
import { pickAndCopy } from './media';

export async function attachMediaToCity(cityId: CityId): Promise<boolean> {
  const picked = await pickAndCopy();
  if (!picked) return false;
  await useMediaStore.getState().addMedia(cityId, picked.uri, picked.type);
  // refresh withMedia set on cities store
  const byCity = useMediaStore.getState().byCity;
  const withMedia = new Set<number>(byCity.keys());
  useCitiesStore.getState().setWithMedia(withMedia);
  return true;
}
```

Add at top: `import { useCitiesStore } from '@/store/useCitiesStore';` if not already present.

- [ ] **Step 3: On app init, derive withMedia after mediaStore loads**

In `TravelStat/App.tsx` after the `Promise.all`, add:

```ts
const byCity = useMediaStore.getState().byCity;
useCitiesStore.getState().setWithMedia(new Set(byCity.keys()));
```

- [ ] **Step 4: Commit**

```bash
git add TravelStat/src/services/media.ts TravelStat/src/services/coordinator.ts TravelStat/App.tsx
git commit -m "feat(media): pick, copy to documentDirectory, withMedia derivation"
```

---

### Task 8.2: Gallery grid on CityDetailScreen

**Files:**
- Modify: `TravelStat/src/screens/CityDetailScreen.tsx`

- [ ] **Step 1: Update CityDetailScreen**

```tsx
// TravelStat/src/screens/CityDetailScreen.tsx
import { useState } from 'react';
import { View, StyleSheet, FlatList, Image, Pressable, Alert } from 'react-native';
import { Button, Text, Switch, IconButton } from 'react-native-paper';
import type { RouteProp } from '@react-navigation/native';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useMediaStore } from '@/store/useMediaStore';
import { markCityVisited, attachMediaToCity } from '@/services/coordinator';
import type { CityId } from '@/utils/types';

export type CityDetailParams = { id: CityId };

interface Props {
  route: RouteProp<{ CityDetail: CityDetailParams }, 'CityDetail'>;
}

const COL = 3;
const GAP = 4;

export default function CityDetailScreen({ route }: Props) {
  const { id } = route.params;
  const city = useCitiesStore(s => s.byId.get(id));
  const visited = useCitiesStore(s => s.visited.has(id));
  const country = useCountriesStore(s => (city ? s.byCode[city.country] : undefined));
  const mediaForCity = useMediaStore(s => s.byCity.get(id) ?? []);
  const deleteMedia = useMediaStore(s => s.deleteMedia);
  const [busy, setBusy] = useState(false);

  if (!city) return <View style={s.empty}><Text>City not found</Text></View>;

  const add = async () => {
    setBusy(true);
    await attachMediaToCity(id);
    setBusy(false);
  };

  return (
    <View style={s.root}>
      <Text variant="headlineMedium">{city.name}</Text>
      <Text variant="bodyMedium" style={{ marginTop: 4 }}>
        {country?.flag} {country?.name ?? city.country} · pop ~{Math.round(city.population / 1000)}k
      </Text>
      <View style={s.row}>
        <Text>Visited</Text>
        <Switch value={visited} onValueChange={() => markCityVisited(id)} />
      </View>
      <View style={s.row}>
        <Text variant="titleMedium">Media ({mediaForCity.length})</Text>
        <Button mode="contained-tonal" onPress={add} disabled={busy}>Add</Button>
      </View>
      <FlatList
        data={mediaForCity}
        numColumns={COL}
        keyExtractor={m => String(m.id)}
        contentContainerStyle={{ paddingTop: 8 }}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() =>
              Alert.alert('Delete media?', '', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteMedia(item.id) },
              ])
            }
            style={{ width: `${100 / COL}%`, aspectRatio: 1, padding: GAP / 2 }}
          >
            <Image source={{ uri: item.file_path }} style={{ flex: 1, borderRadius: 4 }} resizeMode="cover" />
            {item.type === 'video' && (
              <IconButton icon="play-circle" size={28} style={s.playOverlay} />
            )}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={{ opacity: 0.6, marginTop: 16 }}>No media yet</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  playOverlay: { position: 'absolute', right: 0, bottom: 0 },
});
```

- [ ] **Step 2: Run on device, verify gate**

Open a city → tap "Add" → grant permission → pick a photo → grid thumbnail. Open Map → that city pin is now gold. Kill app, relaunch → media still there.

- [ ] **Step 3: Commit**

```bash
git add TravelStat/src/screens/CityDetailScreen.tsx
git commit -m "feat(media): gallery grid with add/delete"
```

---

### Task 8.3: Cut Iteration 8 release

```bash
cd TravelStat
npx tsc --noEmit && npm test
eas build --platform android --profile preview --non-interactive
```

```bash
cd C:\Users\User\Desktop\тре
git tag v0.8.0 -m "Iteration 8: media"
git push origin main --tags
```

GitHub Release `v0.8.0` + APK.

---

# Iteration 9 — Statistics

Continents bar chart (Paper Surfaces), cost-per-country table, derived stats reactive.

**Validation gate:** Stats screen totals match input data; adding a visit updates them without app reload.

### Task 9.1: Stats service

**Files:**
- Create: `TravelStat/src/services/stats.ts`
- Create: `TravelStat/src/services/stats.test.ts`

- [ ] **Step 1: `stats.ts`**

```ts
// TravelStat/src/services/stats.ts
import type { CountryMeta, IsoCode, Visit } from '@/utils/types';
import { visitDays } from '@/utils/dates';

export interface PerContinent { continent: string; count: number; }

export function countriesPerContinent(
  visited: Set<IsoCode>,
  byCode: Record<IsoCode, CountryMeta>,
): PerContinent[] {
  const counts: Record<string, number> = {};
  for (const iso of visited) {
    const c = byCode[iso];
    if (!c) continue;
    counts[c.continent] = (counts[c.continent] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([continent, count]) => ({ continent, count }))
    .sort((a, b) => b.count - a.count);
}

export interface CountryCost {
  iso: IsoCode;
  days: number;
  totalBudget: number;
  currency: string | null;
  perDay: number;
}

export function costPerCountry(visits: Visit[], baseCurrency: string): CountryCost[] {
  const byIso: Record<IsoCode, { days: number; totalBudget: number; currency: string | null }> = {};
  for (const v of visits) {
    const k = v.country_code;
    if (!byIso[k]) byIso[k] = { days: 0, totalBudget: 0, currency: null };
    byIso[k].days += visitDays(v.start_date, v.end_date);
    if (v.budget != null && v.budget_currency === baseCurrency) {
      byIso[k].totalBudget += v.budget;
      byIso[k].currency = baseCurrency;
    }
  }
  return Object.entries(byIso)
    .map(([iso, x]) => ({
      iso,
      days: x.days,
      totalBudget: x.totalBudget,
      currency: x.currency,
      perDay: x.days > 0 && x.totalBudget > 0 ? x.totalBudget / x.days : 0,
    }))
    .sort((a, b) => b.perDay - a.perDay);
}
```

- [ ] **Step 2: `stats.test.ts`**

```ts
// TravelStat/src/services/stats.test.ts
import { countriesPerContinent, costPerCountry } from './stats';
import type { CountryMeta, Visit } from '@/utils/types';

const byCode: Record<string, CountryMeta> = {
  MX: { iso_code: 'MX', name: 'Mexico', continent: 'North America', flag: '🇲🇽' },
  JP: { iso_code: 'JP', name: 'Japan', continent: 'Asia', flag: '🇯🇵' },
  CN: { iso_code: 'CN', name: 'China', continent: 'Asia', flag: '🇨🇳' },
};

test('countriesPerContinent aggregates and sorts', () => {
  const out = countriesPerContinent(new Set(['MX', 'JP', 'CN']), byCode);
  expect(out).toEqual([
    { continent: 'Asia', count: 2 },
    { continent: 'North America', count: 1 },
  ]);
});

test('costPerCountry only sums same-currency budgets', () => {
  const v: Visit[] = [
    { id: 1, country_code: 'MX', city_id: null, start_date: '2026-01-01', end_date: '2026-01-10', notes: null, budget: 1400, budget_currency: 'USD' },
    { id: 2, country_code: 'JP', city_id: null, start_date: '2026-02-01', end_date: '2026-02-12', notes: null, budget: 280000, budget_currency: 'JPY' },
  ];
  const out = costPerCountry(v, 'USD');
  expect(out[0].iso).toBe('MX');
  expect(out[0].perDay).toBeCloseTo(140);
  const jp = out.find(x => x.iso === 'JP');
  expect(jp?.totalBudget).toBe(0);     // JPY ignored under USD base
  expect(jp?.currency).toBe(null);
});
```

- [ ] **Step 3: Run tests**

```bash
cd TravelStat
npm test -- stats
```

- [ ] **Step 4: Commit**

```bash
git add TravelStat/src/services/stats.ts TravelStat/src/services/stats.test.ts
git commit -m "feat(stats): per-continent and per-country cost aggregates"
```

---

### Task 9.2: StatisticsScreen

**Files:**
- Modify: `TravelStat/src/screens/StatisticsScreen.tsx`

- [ ] **Step 1: Implement**

```tsx
// TravelStat/src/screens/StatisticsScreen.tsx
import { ScrollView, View, StyleSheet } from 'react-native';
import { Card, DataTable, Surface, Text } from 'react-native-paper';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { countriesPerContinent, costPerCountry } from '@/services/stats';
import { fmtMoney } from '@/utils/currency';

export default function StatisticsScreen() {
  const byCode = useCountriesStore(s => s.byCode);
  const visited = useCountriesStore(s => s.visited);
  const visits = useVisitsStore(s => s.visits);
  const baseCurrency = useSettingsStore(s => s.baseCurrency);

  const continents = countriesPerContinent(visited, byCode);
  const maxCount = continents[0]?.count ?? 1;
  const costs = costPerCountry(visits, baseCurrency).slice(0, 12);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="titleMedium">Countries per continent</Text>
      <Card style={{ marginVertical: 8 }}>
        <Card.Content>
          {continents.length === 0 && <Text style={{ opacity: 0.6 }}>No visits yet</Text>}
          {continents.map(c => (
            <View key={c.continent} style={s.barRow}>
              <Text style={s.barLabel}>{c.continent}</Text>
              <Surface
                elevation={0}
                style={[s.bar, { flex: c.count / maxCount, backgroundColor: '#4ea1f7' }]}
              />
              <Text style={s.barValue}>{c.count}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Text variant="titleMedium">Cost per country ({baseCurrency} only)</Text>
      <Card style={{ marginVertical: 8 }}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Country</DataTable.Title>
            <DataTable.Title numeric>Days</DataTable.Title>
            <DataTable.Title numeric>Budget</DataTable.Title>
            <DataTable.Title numeric>/day</DataTable.Title>
          </DataTable.Header>
          {costs.length === 0 && (
            <DataTable.Row><DataTable.Cell>No data</DataTable.Cell><DataTable.Cell> </DataTable.Cell><DataTable.Cell> </DataTable.Cell><DataTable.Cell> </DataTable.Cell></DataTable.Row>
          )}
          {costs.map(c => (
            <DataTable.Row key={c.iso}>
              <DataTable.Cell>{byCode[c.iso]?.flag} {byCode[c.iso]?.name ?? c.iso}</DataTable.Cell>
              <DataTable.Cell numeric>{c.days}</DataTable.Cell>
              <DataTable.Cell numeric>{c.totalBudget > 0 ? fmtMoney(c.totalBudget, baseCurrency) : '—'}</DataTable.Cell>
              <DataTable.Cell numeric>{c.perDay > 0 ? fmtMoney(c.perDay, baseCurrency) : '—'}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  barLabel: { width: 110, fontSize: 12 },
  bar: { height: 14, marginHorizontal: 8, borderRadius: 4 },
  barValue: { width: 24, textAlign: 'right' },
});
```

- [ ] **Step 2: Run on device, verify gate**

Add a couple of visits via Timeline → Statistics screen shows them. Each new visit updates the screen on next navigation.

- [ ] **Step 3: Commit**

```bash
git add TravelStat/src/screens/StatisticsScreen.tsx
git commit -m "feat(stats): continents bar chart and cost-per-country table"
```

---

### Task 9.3: Cut Iteration 9 release

```bash
cd TravelStat
npx tsc --noEmit && npm test
eas build --platform android --profile preview --non-interactive
```

```bash
cd C:\Users\User\Desktop\тре
git tag v0.9.0 -m "Iteration 9: statistics"
git push origin main --tags
```

GitHub Release `v0.9.0` + APK.

---

# Iteration 10 — Achievements

Engine wired into coordinator, achievements grid screen, Snackbar toast on unlock.

**Validation gate:** Mark 1 country → "First Flight" unlocks with toast → reload → unlock persists with original date.

### Task 10.1: Evaluator and snapshot

**Files:**
- Modify: `TravelStat/src/services/achievements.ts`
- Create: `TravelStat/src/services/achievements.test.ts`

- [ ] **Step 1: Add evaluator below `ACHIEVEMENTS` in `achievements.ts`**

```ts
// append to TravelStat/src/services/achievements.ts
import type { AchievementSnapshot, CountryMeta, IsoCode } from '@/utils/types';

export function buildSnapshot(args: {
  countriesVisited: Set<IsoCode>;
  citiesVisited: Set<number>;
  byCode: Record<IsoCode, CountryMeta>;
}): AchievementSnapshot {
  const continents = new Set<string>();
  for (const iso of args.countriesVisited) {
    const c = args.byCode[iso];
    if (c) continents.add(c.continent);
  }
  return {
    countriesVisited: args.countriesVisited.size,
    citiesVisited: args.citiesVisited.size,
    continentsVisited: continents.size,
  };
}

export function newlyUnlocked(
  snapshot: AchievementSnapshot,
  current: Record<string, { unlocked: boolean }>,
): string[] {
  const out: string[] = [];
  for (const def of ACHIEVEMENTS) {
    const isUnlocked = current[def.id]?.unlocked;
    if (!isUnlocked && def.check(snapshot)) out.push(def.id);
  }
  return out;
}
```

- [ ] **Step 2: Test**

```ts
// TravelStat/src/services/achievements.test.ts
import { ACHIEVEMENTS, buildSnapshot, newlyUnlocked } from './achievements';
import type { CountryMeta } from '@/utils/types';

const byCode: Record<string, CountryMeta> = {
  MX: { iso_code: 'MX', name: 'Mexico', continent: 'North America', flag: '🇲🇽' },
  JP: { iso_code: 'JP', name: 'Japan',  continent: 'Asia',          flag: '🇯🇵' },
};

test('first_flight unlocks at 1 country', () => {
  const snap = buildSnapshot({ countriesVisited: new Set(['MX']), citiesVisited: new Set(), byCode });
  const out = newlyUnlocked(snap, {});
  expect(out).toContain('first_flight');
});

test('does not re-unlock already unlocked', () => {
  const snap = buildSnapshot({ countriesVisited: new Set(['MX']), citiesVisited: new Set(), byCode });
  const out = newlyUnlocked(snap, { first_flight: { unlocked: true } });
  expect(out).not.toContain('first_flight');
});

test('continental_traveler needs 5 distinct continents', () => {
  // 2 countries → 2 continents → not yet
  const snap = buildSnapshot({ countriesVisited: new Set(['MX', 'JP']), citiesVisited: new Set(), byCode });
  expect(newlyUnlocked(snap, {})).not.toContain('continental_traveler');
});
```

- [ ] **Step 3: Run**

```bash
cd TravelStat
npm test -- achievements
```

- [ ] **Step 4: Commit**

```bash
git add TravelStat/src/services/achievements.ts TravelStat/src/services/achievements.test.ts
git commit -m "feat(achievements): snapshot builder and newlyUnlocked engine"
```

---

### Task 10.2: Wire into coordinator

**Files:**
- Modify: `TravelStat/src/services/coordinator.ts`
- Modify: `TravelStat/src/store/useAchievementsStore.ts` (already has `unlock` action)

- [ ] **Step 1: Add evaluator call after mutations**

Append to `TravelStat/src/services/coordinator.ts`:

```ts
import { useAchievementsStore } from '@/store/useAchievementsStore';
import { buildSnapshot, newlyUnlocked } from './achievements';

export async function evaluateAchievements(): Promise<string[]> {
  const cs = useCountriesStore.getState();
  const ci = useCitiesStore.getState();
  const ac = useAchievementsStore.getState();
  const snap = buildSnapshot({
    countriesVisited: cs.visited,
    citiesVisited: ci.visited,
    byCode: cs.byCode,
  });
  const ids = newlyUnlocked(snap, ac.byId);
  for (const id of ids) await ac.unlock(id);
  return ids;
}
```

Update `markCountryVisited`, `markCityVisited`, `recordVisit` to call it and return the unlocked ids:

```ts
export async function markCountryVisited(iso: IsoCode): Promise<string[]> {
  await useCountriesStore.getState().toggleVisited(iso);
  return evaluateAchievements();
}

export async function markCityVisited(id: CityId): Promise<string[]> {
  await useCitiesStore.getState().toggleVisited(id);
  return evaluateAchievements();
}

export async function recordVisit(input: NewVisit): Promise<string[]> {
  await useVisitsStore.getState().addVisit(input);
  if (!useCountriesStore.getState().visited.has(input.country_code)) {
    await useCountriesStore.getState().toggleVisited(input.country_code);
  }
  if (input.city_id && !useCitiesStore.getState().visited.has(input.city_id)) {
    await useCitiesStore.getState().toggleVisited(input.city_id);
  }
  return evaluateAchievements();
}
```

- [ ] **Step 2: Snackbar in MapScreen**

In `TravelStat/src/screens/MapScreen.tsx` update the `onCountryPress` to also show achievement unlocks:

```tsx
const onCountryPress = async (iso: IsoCode) => {
  const unlocked = await markCountryVisited(iso);
  const name = byCode[iso]?.name ?? iso;
  const visited = useCountriesStore.getState().visited.has(iso);
  if (unlocked.length > 0) setMsg(`🏆 Achievement: ${unlocked[0]}`);
  else setMsg(visited ? `Marked ${name} visited ✓` : `Unmarked ${name}`);
};
```

- [ ] **Step 3: Commit**

```bash
git add TravelStat/src/services/coordinator.ts TravelStat/src/screens/MapScreen.tsx
git commit -m "feat(achievements): evaluate after coordinator mutations + toast"
```

---

### Task 10.3: AchievementsScreen grid

**Files:**
- Create: `TravelStat/src/components/AchievementBadge.tsx`
- Modify: `TravelStat/src/screens/AchievementsScreen.tsx`

- [ ] **Step 1: `AchievementBadge.tsx`**

```tsx
// TravelStat/src/components/AchievementBadge.tsx
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fmtDate } from '@/utils/dates';
import type { AchievementDef, AchievementState } from '@/utils/types';

interface Props {
  def: AchievementDef;
  state: AchievementState | undefined;
}

export default function AchievementBadge({ def, state }: Props) {
  const unlocked = state?.unlocked;
  return (
    <Card style={[styles.card, !unlocked && { opacity: 0.45 }]}>
      <Card.Content style={styles.inner}>
        <MaterialCommunityIcons
          name={def.icon as any}
          size={36}
          color={unlocked ? '#34C759' : '#888'}
        />
        <Text variant="titleMedium" style={{ marginTop: 8 }}>{def.name}</Text>
        <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 4 }}>{def.description}</Text>
        {unlocked && state?.unlocked_at && (
          <Text variant="labelSmall" style={{ marginTop: 6, opacity: 0.7 }}>
            {fmtDate(state.unlocked_at)}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6 },
  inner: { alignItems: 'center', paddingVertical: 12 },
});
```

- [ ] **Step 2: `AchievementsScreen.tsx`**

```tsx
// TravelStat/src/screens/AchievementsScreen.tsx
import { ScrollView, View } from 'react-native';
import { useAchievementsStore } from '@/store/useAchievementsStore';
import AchievementBadge from '@/components/AchievementBadge';

export default function AchievementsScreen() {
  const defs = useAchievementsStore(s => s.definitions);
  const byId = useAchievementsStore(s => s.byId);

  const pairs: Array<[typeof defs[number], typeof defs[number] | undefined]> = [];
  for (let i = 0; i < defs.length; i += 2) pairs.push([defs[i], defs[i + 1]]);

  return (
    <ScrollView contentContainerStyle={{ padding: 8 }}>
      {pairs.map(([a, b], i) => (
        <View key={i} style={{ flexDirection: 'row' }}>
          <AchievementBadge def={a} state={byId[a.id]} />
          {b ? <AchievementBadge def={b} state={byId[b.id]} /> : <View style={{ flex: 1 }} />}
        </View>
      ))}
    </ScrollView>
  );
}
```

- [ ] **Step 3: Verify gate**

On device: clear data (Settings reset to be added in Task 10.4) or fresh install → mark 1 country → toast "🏆 Achievement: first_flight" → Achievements screen shows First Flight colored + date.

- [ ] **Step 4: Commit**

```bash
git add TravelStat/src/components/AchievementBadge.tsx TravelStat/src/screens/AchievementsScreen.tsx
git commit -m "feat(achievements): grid screen with badges"
```

---

### Task 10.4: Settings screen with reset

**Files:**
- Modify: `TravelStat/src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Implement**

```tsx
// TravelStat/src/screens/SettingsScreen.tsx
import { useState } from 'react';
import { View, Alert } from 'react-native';
import { Button, List, RadioButton, Text } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useMediaStore } from '@/store/useMediaStore';
import { useAchievementsStore } from '@/store/useAchievementsStore';
import { getDb } from '@/database/client';
import { runMigrations } from '@/database/migrations';
import { CURRENCIES } from '@/utils/currency';
import { purgeAllMedia } from '@/services/media';

export default function SettingsScreen() {
  const baseCurrency = useSettingsStore(s => s.baseCurrency);
  const setBaseCurrency = useSettingsStore(s => s.setBaseCurrency);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    try {
      const db = await getDb();
      await db.execAsync(`
        DROP TABLE IF EXISTS countries;
        DROP TABLE IF EXISTS cities;
        DROP TABLE IF EXISTS visits;
        DROP TABLE IF EXISTS media;
        DROP TABLE IF EXISTS achievements;
        DROP TABLE IF EXISTS meta;
      `);
      await purgeAllMedia();
      await runMigrations();
      await Promise.all([
        useCountriesStore.getState().loadFromDb(),
        useCitiesStore.getState().loadFromDb(),
        useVisitsStore.getState().loadFromDb(),
        useMediaStore.getState().loadFromDb(),
        useAchievementsStore.getState().loadFromDb(),
        useSettingsStore.getState().loadFromDb(),
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="titleMedium">Base currency</Text>
      <RadioButton.Group onValueChange={v => setBaseCurrency(v)} value={baseCurrency}>
        {CURRENCIES.map(c => (
          <RadioButton.Item key={c} label={c} value={c} />
        ))}
      </RadioButton.Group>

      <Text variant="titleMedium" style={{ marginTop: 24 }}>Danger zone</Text>
      <Button
        mode="outlined"
        onPress={() =>
          Alert.alert('Reset all data?', 'This deletes all visits, media, and achievements.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: reset },
          ])
        }
        disabled={busy}
        style={{ marginTop: 8 }}
      >
        Reset all data
      </Button>
    </View>
  );
}
```

- [ ] **Step 2: Remove the Debug drawer entry**

In `TravelStat/src/navigation/RootDrawer.tsx`, remove the `<Drawer.Screen name="Debug" ...>` entry and the `DebugScreen` import.

- [ ] **Step 3: Verify**

Settings screen radio buttons cycle base currency. Reset wipes state, achievements relock.

- [ ] **Step 4: Commit**

```bash
git add TravelStat/src/screens/SettingsScreen.tsx TravelStat/src/navigation/RootDrawer.tsx
git commit -m "feat(settings): base currency selector and reset-all-data"
```

---

### Task 10.5: Cut Iteration 10 release (v1.0.0)

- [ ] **Step 1: Bump app version**

In `TravelStat/app.json` set `"version": "1.0.0"`.

- [ ] **Step 2: Final gates**

```bash
cd TravelStat
npx tsc --noEmit && npm test
```

- [ ] **Step 3: Final APK build**

```bash
eas build --platform android --profile preview --non-interactive
```

- [ ] **Step 4: Tag and release**

```bash
cd C:\Users\User\Desktop\тре
git add TravelStat/app.json
git commit -m "chore: bump version to 1.0.0"
git tag v1.0.0 -m "TravelStat 1.0.0 — full prototype"
git push origin main --tags
```

GitHub Release `v1.0.0` titled "TravelStat 1.0.0 — full prototype". Body lists the 8 user-visible features and links to the spec. Attach APK.

---

## Self-review checklist (run before handoff)

### Spec coverage

- §3 Architecture → Iter 1, 2 (folder skeleton, store/coordinator pattern).
- §4 Data layer → Iter 2 (schema, repositories, migration, seeding).
- §5 Stores → Iter 2 (all 6 stores including settings).
- §6 Map module → Iter 3 (CountryLayer, WorldMap, viewport), Iter 5 (CityLayer).
- §7 Screens & navigation → Iter 1 (drawer + stubs), Iter 4 (Home), Iter 5 (CityDetail + MapStack), Iter 6 (Wishlist), Iter 7 (Timeline + AddVisit + TimelineStack), Iter 9 (Statistics), Iter 10 (Achievements + Settings).
- §8 Budget & duration → Iter 7 (visit form, base currency, avg/day on Home), Iter 9 (cost-per-country table), Iter 10 (settings currency selector).
- §9 Media → Iter 8 (picker, copy, gallery, gold pin, reset purge in Iter 10).
- §10 Achievements engine → Iter 10 (snapshot/newlyUnlocked, coordinator wiring, badge UI, persistence).
- §11 Iteration plan → matches 1:1 (plus Iter 0 prep).
- §13 Release strategy → APK build at end of each iteration from Iter 1, tag v0.N.0, GitHub Release with APK attached.

Country detail screen mentioned in spec §7 is **not** implemented as a separate screen — instead the map tap toggles visited inline, and country info surfaces on Home and Statistics. This is a pragmatic simplification; if a full detail screen is needed later, add it as a follow-up.

### Placeholder scan

No "TBD", "TODO" markers in steps. Every code-changing step includes the actual code. Every command includes expected output where relevant.

### Type consistency

`markCountryVisited`, `markCityVisited`, `recordVisit` all return `Promise<string[]>` after Iter 10. Earlier iterations (4–9) defined them with `Promise<void>` and call sites ignore the return value — this is forward-compatible (adding a returned value is non-breaking). The coordinator is updated in Task 10.2 atomically with the call-site update for MapScreen.

`CountryRow.visited`, `CountryRow.wishlist` are `number` in the row type but `Set<IsoCode>` in the store — stores convert `1`→membership. Consistent across all stores.

`useViewport` exposes `region` from Iter 3 onward; `WorldMap` props gained `onCityPress` in Iter 5 (Task 5.2 modifies the signature).

Hooks called inside `coordinator.ts` (`useCountriesStore.getState()`) are NOT React hooks — `.getState()` is safe outside components.

---

## Execution handoff

Plan complete and saved to [`docs/superpowers/plans/2026-05-18-travelstat-implementation.md`](2026-05-18-travelstat-implementation.md). Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task (or per small group of related tasks), review between dispatches, fast iteration with isolated context. Best fit here because each iteration's tasks are well-scoped and the spec is locked.

**2. Inline Execution** — I execute tasks in this session using superpowers:executing-plans, batched with checkpoints (typically one iteration per batch) for you to review on real device.

Which approach?
