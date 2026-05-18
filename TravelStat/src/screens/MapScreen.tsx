import { useState } from 'react';
import { View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import WorldMap from '@/map/WorldMap';
import { useCountriesStore } from '@/store/useCountriesStore';
import { markCountryVisited } from '@/services/coordinator';
import type { IsoCode } from '@/utils/types';

export default function MapScreen() {
  const [msg, setMsg] = useState<string | null>(null);
  const byCode = useCountriesStore(s => s.byCode);

  const onCountryPress = async (iso: IsoCode) => {
    await markCountryVisited(iso);
    const name = byCode[iso]?.name ?? iso;
    const visited = useCountriesStore.getState().visited.has(iso);
    setMsg(visited ? `Marked ${name} visited ✓` : `Unmarked ${name}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <WorldMap onCountryPress={onCountryPress} />
      <Snackbar visible={!!msg} onDismiss={() => setMsg(null)} duration={1800}>
        {msg ?? ''}
      </Snackbar>
    </View>
  );
}
