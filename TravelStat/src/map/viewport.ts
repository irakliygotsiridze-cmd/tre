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
