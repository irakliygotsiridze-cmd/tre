import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import type { IsoCode, CityId, NewVisit } from '@/utils/types';

export async function markCountryVisited(iso: IsoCode): Promise<void> {
  await useCountriesStore.getState().toggleVisited(iso);
}

export async function markCityVisited(id: CityId): Promise<void> {
  await useCitiesStore.getState().toggleVisited(id);
}

export async function recordVisit(input: NewVisit): Promise<void> {
  await useVisitsStore.getState().addVisit(input);
  if (!useCountriesStore.getState().visited.has(input.country_code)) {
    await useCountriesStore.getState().toggleVisited(input.country_code);
  }
  if (input.city_id && !useCitiesStore.getState().visited.has(input.city_id)) {
    await useCitiesStore.getState().toggleVisited(input.city_id);
  }
}
