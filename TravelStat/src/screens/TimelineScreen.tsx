import { FlatList, View } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import VisitListItem from '@/components/VisitListItem';
import type { TimelineStackParamList } from '@/navigation/TimelineStack';

type Nav = StackNavigationProp<TimelineStackParamList, 'Timeline'>;

export default function TimelineScreen() {
  const visits = useVisitsStore(s => s.visits);
  const byCode = useCountriesStore(s => s.byCode);
  const cityById = useCitiesStore(s => s.byId);
  const nav = useNavigation<Nav>();

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={visits}
        keyExtractor={v => String(v.id)}
        renderItem={({ item }) => (
          <VisitListItem
            visit={item}
            country={byCode[item.country_code]}
            cityName={item.city_id ? cityById.get(item.city_id)?.name : undefined}
          />
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 64, opacity: 0.6 }}>No visits yet</Text>}
      />
      <FAB icon="plus" style={{ position: 'absolute', right: 16, bottom: 16 }} onPress={() => nav.navigate('AddVisit')} />
    </View>
  );
}
