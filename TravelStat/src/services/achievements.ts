import type { AchievementDef, AchievementSnapshot, CountryMeta, IsoCode } from '@/utils/types';

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
