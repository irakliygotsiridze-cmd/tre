import { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Menu, Button, Card, DataTable, Chip } from 'react-native-paper';
import StatCard from '@/components/StatCard';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { visitDays } from '@/utils/dates';
import { fmtMoney, averagePerDay } from '@/utils/currency';
import { costPerCountry } from '@/services/stats';

const FILTER_ALL = '__all__';

export default function HomeScreen() {
  const countriesByCode = useCountriesStore(s => s.byCode);
  const visitedCountries = useCountriesStore(s => s.visited);
  const wishlistCountries = useCountriesStore(s => s.wishlist);
  const visitedCities = useCitiesStore(s => s.visited);
  const allVisits = useVisitsStore(s => s.visits);
  const baseCurrency = useSettingsStore(s => s.baseCurrency);

  const [filterIso, setFilterIso] = useState<string>(FILTER_ALL);
  const [menuOpen, setMenuOpen] = useState(false);

  const filterOptions = useMemo(() => {
    const isoSet = new Set<string>();
    for (const v of allVisits) isoSet.add(v.country_code);
    return Array.from(isoSet)
      .map(iso => countriesByCode[iso])
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allVisits, countriesByCode]);

  // Filter visits if specific country selected
  const visits = useMemo(
    () => (filterIso === FILTER_ALL ? allVisits : allVisits.filter(v => v.country_code === filterIso)),
    [allVisits, filterIso],
  );

  const totalCountries = Object.keys(countriesByCode).length;
  const continentSet = new Set<string>();
  for (const iso of visitedCountries) {
    const c = countriesByCode[iso];
    if (c) continentSet.add(c.continent);
  }

  // Stats — when filtered, recompute counts based on filtered visits
  const filteredCountriesVisited = filterIso === FILTER_ALL
    ? visitedCountries.size
    : (visitedCountries.has(filterIso) ? 1 : 0);
  const filteredCitiesVisited = filterIso === FILTER_ALL
    ? visitedCities.size
    : (() => {
        const cities = new Set<number>();
        for (const v of visits) if (v.city_id) cities.add(v.city_id);
        return cities.size;
      })();

  const totalDays = visits.reduce((n, v) => n + visitDays(v.start_date, v.end_date), 0);
  const sameCurrency = visits.filter(v => v.budget != null && v.budget_currency === baseCurrency);
  const sameCurrencyDays = sameCurrency.reduce((n, v) => n + visitDays(v.start_date, v.end_date), 0);
  const sameCurrencyBudget = sameCurrency.reduce((n, v) => n + (v.budget ?? 0), 0);
  const avgPerDay = averagePerDay(sameCurrencyBudget, sameCurrencyDays);

  // Cost analytics (always across all visits, regardless of filter — for comparison)
  const costs = useMemo(() => costPerCountry(allVisits, baseCurrency).filter(c => c.perDay > 0), [allVisits, baseCurrency]);
  const cheapest = costs.length ? costs[costs.length - 1] : null;
  const mostExpensive = costs.length ? costs[0] : null;

  return (
    <ScrollView contentContainerStyle={{ padding: 8 }}>
      <Text variant="headlineMedium" style={{ marginHorizontal: 8, marginVertical: 12 }}>TravelStat ✈️</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, marginBottom: 8 }}>
        <Text variant="labelLarge" style={{ marginRight: 8 }}>Filter:</Text>
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)}
          anchor={
            <Button mode="outlined" onPress={() => setMenuOpen(true)} compact>
              {filterIso === FILTER_ALL ? 'All countries' : `${countriesByCode[filterIso]?.flag ?? ''} ${countriesByCode[filterIso]?.name ?? filterIso}`}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setFilterIso(FILTER_ALL); setMenuOpen(false); }} title="All countries" />
          {filterOptions.map(c => (
            <Menu.Item
              key={c.iso_code}
              onPress={() => { setFilterIso(c.iso_code); setMenuOpen(false); }}
              title={`${c.flag} ${c.name}`}
            />
          ))}
        </Menu>
        {filterIso !== FILTER_ALL && (
          <Chip onClose={() => setFilterIso(FILTER_ALL)} style={{ marginLeft: 8 }} compact>clear</Chip>
        )}
      </View>

      <View style={{ flexDirection: 'row' }}>
        <StatCard
          label="Countries"
          value={`${filteredCountriesVisited} / ${filterIso === FILTER_ALL ? totalCountries : 1}`}
          progress={filterIso === FILTER_ALL ? filteredCountriesVisited / totalCountries : filteredCountriesVisited}
        />
        <StatCard label="Cities" value={`${filteredCitiesVisited}`} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <StatCard
          label="Continents"
          value={filterIso === FILTER_ALL ? `${continentSet.size} / 7` : (countriesByCode[filterIso]?.continent ?? '—')}
          progress={filterIso === FILTER_ALL ? continentSet.size / 7 : undefined}
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

      <Card style={{ marginTop: 12, marginHorizontal: 6 }}>
        <Card.Title title={`Cost analytics (${baseCurrency})`} />
        <Card.Content>
          {costs.length === 0 ? (
            <Text style={{ opacity: 0.7 }}>Add visits with a budget in {baseCurrency} to see cost analytics.</Text>
          ) : (
            <>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text variant="labelMedium">Cheapest / day</Text>
                  {cheapest && (
                    <Text variant="titleMedium">
                      {countriesByCode[cheapest.iso]?.flag} {countriesByCode[cheapest.iso]?.name ?? cheapest.iso} · {fmtMoney(cheapest.perDay, baseCurrency)}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="labelMedium">Most expensive / day</Text>
                  {mostExpensive && (
                    <Text variant="titleMedium">
                      {countriesByCode[mostExpensive.iso]?.flag} {countriesByCode[mostExpensive.iso]?.name ?? mostExpensive.iso} · {fmtMoney(mostExpensive.perDay, baseCurrency)}
                    </Text>
                  )}
                </View>
              </View>

              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Country</DataTable.Title>
                  <DataTable.Title numeric>Days</DataTable.Title>
                  <DataTable.Title numeric>/ day</DataTable.Title>
                </DataTable.Header>
                {costs.slice(0, 8).map(c => (
                  <DataTable.Row key={c.iso}>
                    <DataTable.Cell>{countriesByCode[c.iso]?.flag} {countriesByCode[c.iso]?.name ?? c.iso}</DataTable.Cell>
                    <DataTable.Cell numeric>{c.days}</DataTable.Cell>
                    <DataTable.Cell numeric>{fmtMoney(c.perDay, baseCurrency)}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
