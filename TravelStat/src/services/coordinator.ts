import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useVisitCitiesStore } from '@/store/useVisitCitiesStore';
import { useMediaStore } from '@/store/useMediaStore';
import { useAchievementsStore } from '@/store/useAchievementsStore';
import type { IsoCode, CityId, NewVisit } from '@/utils/types';
import { pickAndCopy } from './media';
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

export async function markCountryVisited(iso: IsoCode): Promise<string[]> {
  await useCountriesStore.getState().toggleVisited(iso);
  return evaluateAchievements();
}

export async function markCityVisited(id: CityId): Promise<string[]> {
  const ci = useCitiesStore.getState();
  const wasVisited = ci.visited.has(id);
  await ci.toggleVisited(id);
  // If we just marked as visited (not unmarked), also ensure the country is visited.
  if (!wasVisited) {
    const city = ci.byId.get(id);
    if (city) {
      const cs = useCountriesStore.getState();
      if (!cs.visited.has(city.country)) {
        await cs.toggleVisited(city.country);
      }
    }
  }
  return evaluateAchievements();
}

export async function recordVisit(input: NewVisit): Promise<string[]> {
  const visit = await useVisitsStore.getState().addVisit(input);
  if (!useCountriesStore.getState().visited.has(input.country_code)) {
    await useCountriesStore.getState().toggleVisited(input.country_code);
  }
  // Persist visit_cities if provided
  if (input.cities && input.cities.length > 0) {
    await useVisitCitiesStore.getState().setForVisit(visit.id, input.cities);
    // Mark each city as visited (and through markCityVisited, its country too)
    const ci = useCitiesStore.getState();
    for (const vc of input.cities) {
      if (!ci.visited.has(vc.city_id)) {
        await ci.toggleVisited(vc.city_id);
      }
    }
  } else if (input.city_id && !useCitiesStore.getState().visited.has(input.city_id)) {
    await useCitiesStore.getState().toggleVisited(input.city_id);
  }
  return evaluateAchievements();
}

export async function attachMediaToCity(cityId: CityId): Promise<boolean> {
  const picked = await pickAndCopy();
  if (!picked) return false;
  await useMediaStore.getState().addMedia(cityId, picked.uri, picked.type);
  const byCity = useMediaStore.getState().byCity;
  const withMedia = new Set<number>(byCity.keys());
  useCitiesStore.getState().setWithMedia(withMedia);
  return true;
}
