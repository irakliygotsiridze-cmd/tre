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
  start_date: string;
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
  created_at: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  icon: string;
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
