import { Platform, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useEffect } from 'react';
import { useViewport } from './useViewport';
import CountryLayer from './CountryLayer';
import CityLayer from './CityLayer';
import type { IsoCode, CityId } from '@/utils/types';

interface Props {
  onCountryPress: (iso: IsoCode) => void;
  onCityPress: (id: CityId) => void;
  onReady?: (api: { flyTo: (lat: number, lng: number, delta?: number) => void }) => void;
}

export default function WorldMap({ onCountryPress, onCityPress, onReady }: Props) {
  const { initial, mapRef, onRegionChangeComplete, flyTo } = useViewport();

  useEffect(() => { onReady?.({ flyTo }); }, [flyTo, onReady]);

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
      <CityLayer onCityPress={onCityPress} />
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
