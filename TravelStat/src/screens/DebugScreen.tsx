import { ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useAchievementsStore } from '@/store/useAchievementsStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function DebugScreen() {
  const countries = useCountriesStore(s => s.byCode);
  const cities = useCitiesStore(s => s.all);
  const ach = useAchievementsStore(s => s.byId);
  const visits = useVisitsStore(s => s.visits);
  const cur = useSettingsStore(s => s.baseCurrency);

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text>Countries seeded: {Object.keys(countries).length}</Text>
      <Text>Cities seeded: {cities.length}</Text>
      <Text>Achievements: {Object.keys(ach).length}</Text>
      <Text>Visits: {visits.length}</Text>
      <Text>Base currency: {cur}</Text>
    </ScrollView>
  );
}
