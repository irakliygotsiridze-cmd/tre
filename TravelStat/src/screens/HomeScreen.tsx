import { ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';
import StatCard from '@/components/StatCard';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { visitDays } from '@/utils/dates';
import { fmtMoney, averagePerDay } from '@/utils/currency';

export default function HomeScreen() {
  const countriesByCode = useCountriesStore(s => s.byCode);
  const visitedCountries = useCountriesStore(s => s.visited);
  const wishlistCountries = useCountriesStore(s => s.wishlist);
  const visitedCities = useCitiesStore(s => s.visited);

  const visits = useVisitsStore(s => s.visits);
  const baseCurrency = useSettingsStore(s => s.baseCurrency);

  const totalCountries = Object.keys(countriesByCode).length;
  const continentSet = new Set<string>();
  for (const iso of visitedCountries) {
    const c = countriesByCode[iso];
    if (c) continentSet.add(c.continent);
  }

  const totalDays = visits.reduce((n, v) => n + visitDays(v.start_date, v.end_date), 0);
  const sameCurrency = visits.filter(v => v.budget != null && v.budget_currency === baseCurrency);
  const sameCurrencyDays = sameCurrency.reduce((n, v) => n + visitDays(v.start_date, v.end_date), 0);
  const sameCurrencyBudget = sameCurrency.reduce((n, v) => n + (v.budget ?? 0), 0);
  const avgPerDay = averagePerDay(sameCurrencyBudget, sameCurrencyDays);

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
      <View style={{ flexDirection: 'row' }}>
        <StatCard label="Travel days" value={`${totalDays}`} />
        <StatCard
          label="Avg / day"
          value={sameCurrencyDays > 0 ? fmtMoney(avgPerDay, baseCurrency) : '—'}
        />
      </View>
    </ScrollView>
  );
}
