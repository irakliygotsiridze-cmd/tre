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
