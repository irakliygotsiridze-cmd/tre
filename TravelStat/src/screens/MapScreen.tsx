import { useState } from 'react';
import { View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import WorldMap from '@/map/WorldMap';
import { useCountriesStore } from '@/store/useCountriesStore';
import { markCountryVisited } from '@/services/coordinator';
import type { IsoCode, CityId } from '@/utils/types';
import type { MapStackParamList } from '@/navigation/MapStack';

type Nav = StackNavigationProp<MapStackParamList, 'Map'>;

export default function MapScreen() {
  const [msg, setMsg] = useState<string | null>(null);
  const byCode = useCountriesStore(s => s.byCode);
  const nav = useNavigation<Nav>();

  const onCountryPress = async (iso: IsoCode) => {
    const unlocked = await markCountryVisited(iso);
    const name = byCode[iso]?.name ?? iso;
    const visited = useCountriesStore.getState().visited.has(iso);
    if (unlocked.length > 0) setMsg(`🏆 Achievement: ${unlocked[0]}`);
    else setMsg(visited ? `Marked ${name} visited ✓` : `Unmarked ${name}`);
  };

  const onCityPress = (id: CityId) => nav.navigate('CityDetail', { id });

  return (
    <View style={{ flex: 1 }}>
      <WorldMap onCountryPress={onCountryPress} onCityPress={onCityPress} />
      <Snackbar visible={!!msg} onDismiss={() => setMsg(null)} duration={1800}>{msg ?? ''}</Snackbar>
    </View>
  );
}
