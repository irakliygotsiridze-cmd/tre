import { ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';
import StatCard from '@/components/StatCard';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';

export default function HomeScreen() {
  const countriesByCode = useCountriesStore(s => s.byCode);
  const visitedCountries = useCountriesStore(s => s.visited);
  const wishlistCountries = useCountriesStore(s => s.wishlist);
  const visitedCities = useCitiesStore(s => s.visited);

  const totalCountries = Object.keys(countriesByCode).length;
  const continentSet = new Set<string>();
  for (const iso of visitedCountries) {
    const c = countriesByCode[iso];
    if (c) continentSet.add(c.continent);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 8 }}>
      <Text variant="headlineMedium" style={{ marginHorizontal: 8, marginVertical: 12 }}>TravelStat ✈️</Text>
      <View style={{ flexDirection: 'row' }}>
        <StatCard
          label="Countries"
          value={`${visitedCountries.size} / ${totalCountries}`}
          progress={visitedCountries.size / totalCountries}
        />
        <StatCard label="Cities" value={`${visitedCities.size}`} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <StatCard
          label="Continents"
          value={`${continentSet.size} / 7`}
          progress={continentSet.size / 7}
        />
        <StatCard label="Wishlist" value={`${wishlistCountries.size}`} />
      </View>
    </ScrollView>
  );
}
