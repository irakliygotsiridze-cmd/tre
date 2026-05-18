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
