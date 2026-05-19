import { Marker } from 'react-native-maps';
import { useCitiesStore } from '@/store/useCitiesStore';
import type { CityId } from '@/utils/types';

interface Props {
  onCityPress: (id: CityId) => void;
}

export default function CityLayer({ onCityPress }: Props) {
  const all = useCitiesStore(s => s.all);
  const visited = useCitiesStore(s => s.visited);
  const wishlist = useCitiesStore(s => s.wishlist);
  const withMedia = useCitiesStore(s => s.withMedia);
  const byId = useCitiesStore(s => s.byId);

  // Show: visited (red/gold) + wishlist (blue) — at any zoom level.
  const ids = new Set<CityId>();
  for (const id of visited) ids.add(id);
  for (const id of wishlist) ids.add(id);

  const markers: { id: CityId; lat: number; lng: number; color: 'red' | 'gold' | 'blue' | undefined; title: string }[] = [];
  for (const id of ids) {
    const c = byId.get(id);
    if (!c) continue;
    let color: 'red' | 'gold' | 'blue' | undefined;
    if (visited.has(id)) {
      color = withMedia.has(id) ? 'gold' : 'red';
    } else if (wishlist.has(id)) {
      color = 'blue';
    }
    markers.push({ id, lat: c.lat, lng: c.lng, color, title: c.name });
  }

  return (
    <>
      {markers.map(m => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.lat, longitude: m.lng }}
          title={m.title}
          pinColor={m.color}
          onPress={() => onCityPress(m.id)}
        />
      ))}
    </>
  );
}
