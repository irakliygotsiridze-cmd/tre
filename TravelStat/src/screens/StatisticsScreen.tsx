import { ScrollView, View, StyleSheet } from 'react-native';
import { Card, DataTable, Text } from 'react-native-paper';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { countriesPerContinent, costPerCountry } from '@/services/stats';
import { fmtMoney } from '@/utils/currency';

export default function StatisticsScreen() {
  const byCode = useCountriesStore(s => s.byCode);
  const visited = useCountriesStore(s => s.visited);
  const visits = useVisitsStore(s => s.visits);
  const baseCurrency = useSettingsStore(s => s.baseCurrency);

  const continents = countriesPerContinent(visited, byCode);
  const maxCount = continents[0]?.count ?? 1;
  const costs = costPerCountry(visits, baseCurrency).slice(0, 12);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="titleMedium">Countries per continent</Text>
      <Card style={{ marginVertical: 8 }}>
        <Card.Content>
          {continents.length === 0 && <Text style={{ opacity: 0.6 }}>No visits yet</Text>}
          {continents.map(c => (
            <View key={c.continent} style={s.barRow}>
              <Text style={s.barLabel}>{c.continent}</Text>
              <View
                style={[s.bar, { flex: c.count / maxCount, backgroundColor: '#4ea1f7' }]}
              />
              <Text style={s.barValue}>{c.count}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Text variant="titleMedium">Cost per country ({baseCurrency} only)</Text>
      <Card style={{ marginVertical: 8 }}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Country</DataTable.Title>
            <DataTable.Title numeric>Days</DataTable.Title>
            <DataTable.Title numeric>Budget</DataTable.Title>
            <DataTable.Title numeric>/day</DataTable.Title>
          </DataTable.Header>
          {costs.length === 0 && (
            <DataTable.Row>
              <DataTable.Cell>No data</DataTable.Cell>
              <DataTable.Cell> </DataTable.Cell>
              <DataTable.Cell> </DataTable.Cell>
              <DataTable.Cell> </DataTable.Cell>
            </DataTable.Row>
          )}
          {costs.map(c => (
            <DataTable.Row key={c.iso}>
              <DataTable.Cell>{byCode[c.iso]?.flag} {byCode[c.iso]?.name ?? c.iso}</DataTable.Cell>
              <DataTable.Cell numeric>{c.days}</DataTable.Cell>
              <DataTable.Cell numeric>{c.totalBudget > 0 ? fmtMoney(c.totalBudget, baseCurrency) : '—'}</DataTable.Cell>
              <DataTable.Cell numeric>{c.perDay > 0 ? fmtMoney(c.perDay, baseCurrency) : '—'}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  barLabel: { width: 110, fontSize: 12 },
  bar: { height: 14, marginHorizontal: 8, borderRadius: 4 },
  barValue: { width: 24, textAlign: 'right' },
});
