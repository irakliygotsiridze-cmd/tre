import { View, StyleSheet } from 'react-native';
import { Text, Switch } from 'react-native-paper';
import type { RouteProp } from '@react-navigation/native';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useCountriesStore } from '@/store/useCountriesStore';
import { markCityVisited } from '@/services/coordinator';
import type { CityId } from '@/utils/types';

export type CityDetailParams = { id: CityId };

interface Props {
  route: RouteProp<{ CityDetail: CityDetailParams }, 'CityDetail'>;
}

export default function CityDetailScreen({ route }: Props) {
  const { id } = route.params;
  const city = useCitiesStore(s => s.byId.get(id));
  const visited = useCitiesStore(s => s.visited.has(id));
  const country = useCountriesStore(s => (city ? s.byCode[city.country] : undefined));

  if (!city) return <View style={s.empty}><Text>City not found</Text></View>;

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
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, padding: 24 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 },
});
