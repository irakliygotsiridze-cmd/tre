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
