import { useState } from 'react';
import { View, StyleSheet, FlatList, Image, Pressable, Alert } from 'react-native';
import { Button, Text, Switch, IconButton } from 'react-native-paper';
import type { RouteProp } from '@react-navigation/native';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useMediaStore } from '@/store/useMediaStore';
import { markCityVisited, attachMediaToCity } from '@/services/coordinator';
import type { CityId } from '@/utils/types';

export type CityDetailParams = { id: CityId };

interface Props {
  route: RouteProp<{ CityDetail: CityDetailParams }, 'CityDetail'>;
}

const COL = 3;
const GAP = 4;
const cellWidth = `${Math.floor(10000 / COL) / 100}%` as const;

export default function CityDetailScreen({ route }: Props) {
  const { id } = route.params;
  const city = useCitiesStore(s => s.byId.get(id));
  const visited = useCitiesStore(s => s.visited.has(id));
  const country = useCountriesStore(s => (city ? s.byCode[city.country] : undefined));
  const mediaForCity = useMediaStore(s => s.byCity.get(id) ?? []);
  const deleteMedia = useMediaStore(s => s.deleteMedia);
  const [busy, setBusy] = useState(false);

  if (!city) return <View style={s.empty}><Text>City not found</Text></View>;

  const add = async () => {
    setBusy(true);
    await attachMediaToCity(id);
    setBusy(false);
  };

  return (
    <View style={s.root}>
      <Text variant="headlineMedium">{city.name}</Text>
      <Text variant="bodyMedium" style={{ marginTop: 4 }}>
        {country?.flag} {country?.name ?? city.country} · pop ~{Math.round(city.population / 1000)}k
      </Text>
      <View style={s.row}>
        <Text>Visited</Text>
        <Switch value={visited} onValueChange={() => markCityVisited(id)} />
      </View>
      <View style={s.row}>
        <Text variant="titleMedium">Media ({mediaForCity.length})</Text>
        <Button mode="contained-tonal" onPress={add} disabled={busy}>Add</Button>
      </View>
      <FlatList
        data={mediaForCity}
        numColumns={COL}
        keyExtractor={m => String(m.id)}
        contentContainerStyle={{ paddingTop: 8 }}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() =>
              Alert.alert('Delete media?', '', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteMedia(item.id) },
              ])
            }
            style={{ width: cellWidth, aspectRatio: 1, padding: GAP / 2 }}
          >
            <Image source={{ uri: item.file_path }} style={{ flex: 1, borderRadius: 4 }} resizeMode="cover" />
            {item.type === 'video' && (
              <IconButton icon="play-circle" size={28} style={s.playOverlay} />
            )}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={{ opacity: 0.6, marginTop: 16 }}>No media yet</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  playOverlay: { position: 'absolute', right: 0, bottom: 0 },
});
