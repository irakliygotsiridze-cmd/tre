import { Platform, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useViewport } from './useViewport';
import CountryLayer from './CountryLayer';
import CityLayer from './CityLayer';
import { CITY_VISIBLE_DELTA } from './viewport';
import type { IsoCode, CityId } from '@/utils/types';

interface Props {
  onCountryPress: (iso: IsoCode) => void;
  onCityPress: (id: CityId) => void;
}

export default function WorldMap({ onCountryPress, onCityPress }: Props) {
  const { initial, mapRef, region, onRegionChangeComplete } = useViewport();
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
      {region.latitudeDelta < CITY_VISIBLE_DELTA && (
        <CityLayer region={region} onCityPress={onCityPress} />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
