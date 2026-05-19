import { useMemo, useState, useRef, useCallback } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { Snackbar, Searchbar, Text, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import WorldMap from '@/map/WorldMap';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { markCountryVisited } from '@/services/coordinator';
import { search } from '@/services/search';
import type { IsoCode, CityId } from '@/utils/types';
import type { MapStackParamList } from '@/navigation/MapStack';

type Nav = StackNavigationProp<MapStackParamList, 'Map'>;

export default function MapScreen() {
  const [msg, setMsg] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const byCode = useCountriesStore(s => s.byCode);
  const byCityId = useCitiesStore(s => s.byId);
  const nav = useNavigation<Nav>();

  const flyToRef = useRef<((lat: number, lng: number, delta?: number) => void) | null>(null);
  const onReady = useCallback(
    (api: { flyTo: (lat: number, lng: number, delta?: number) => void }) => {
      flyToRef.current = api.flyTo;
    },
    [],
  );

  const results = useMemo(() => {
    if (!query) return [];
    return search(query, 10);
  }, [query]);

  const onCountryPress = async (iso: IsoCode) => {
    const unlocked = await markCountryVisited(iso);
    const name = byCode[iso]?.name ?? iso;
    const visited = useCountriesStore.getState().visited.has(iso);
    if (unlocked.length > 0) setMsg(`🏆 Achievement: ${unlocked[0]}`);
    else setMsg(visited ? `Marked ${name} visited ✓` : `Unmarked ${name}`);
  };

  const onCityPress = (id: CityId) => nav.navigate('CityDetail', { id });

  const onResultPress = (r: typeof results[number]) => {
    if (r.kind === 'country') {
      // fly to a continent-ish view; we don't have country centroids — use a few hardcoded fallbacks or skip.
      // For now, just dismiss query — country interactions happen via polygon tap.
      setQuery('');
    } else {
      const c = r.item;
      flyToRef.current?.(c.lat, c.lng, 2);
      setQuery('');
      // After flying, immediately open city detail so the user can mark visited.
      nav.navigate('CityDetail', { id: c.id });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <WorldMap onCountryPress={onCountryPress} onCityPress={onCityPress} onReady={onReady} />

      <Surface style={{ position: 'absolute', top: 8, left: 8, right: 8, borderRadius: 8 }} elevation={2}>
        <Searchbar
          placeholder="Search city or country…"
          value={query}
          onChangeText={setQuery}
          style={{ backgroundColor: 'white' }}
        />
        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(r, i) => r.kind + ':' + (r.kind === 'country' ? r.item.iso_code : r.item.id) + ':' + i}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 220 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onResultPress(item)}
                style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#eee' }}
              >
                {item.kind === 'country' ? (
                  <Text>{item.item.flag} {item.item.name} <Text style={{ opacity: 0.6 }}>· country</Text></Text>
                ) : (
                  <Text>
                    {byCode[item.item.country]?.flag ?? '🌍'} {item.item.name}
                    <Text style={{ opacity: 0.6 }}> · {byCode[item.item.country]?.name ?? item.item.country}</Text>
                  </Text>
                )}
              </Pressable>
            )}
          />
        )}
      </Surface>

      <Snackbar visible={!!msg} onDismiss={() => setMsg(null)} duration={1800}>{msg ?? ''}</Snackbar>
    </View>
  );
}
