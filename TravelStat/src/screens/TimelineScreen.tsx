import { FlatList, View } from 'react-native';
import { FAB, Text, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useVisitCitiesStore } from '@/store/useVisitCitiesStore';
import VisitListItem from '@/components/VisitListItem';
import { TRANSPORT_ICON, type TransportMode } from '@/utils/types';
import type { TimelineStackParamList } from '@/navigation/TimelineStack';

type Nav = StackNavigationProp<TimelineStackParamList, 'Timeline'>;

export default function TimelineScreen() {
  const visits = useVisitsStore(s => s.visits);
  const byCode = useCountriesStore(s => s.byCode);
  const cityById = useCitiesStore(s => s.byId);
  const byVisit = useVisitCitiesStore(s => s.byVisit);
  const nav = useNavigation<Nav>();

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={visits}
        keyExtractor={v => String(v.id)}
        renderItem={({ item }) => {
          const visitCities = byVisit.get(item.id) ?? [];
          const cityNamePrimary = visitCities[0]
            ? cityById.get(visitCities[0].city_id)?.name
            : item.city_id ? cityById.get(item.city_id)?.name : undefined;
          return (
            <View>
              <VisitListItem
                visit={item}
                country={byCode[item.country_code]}
                cityName={cityNamePrimary}
              />
              {visitCities.length > 1 && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                  {visitCities.map((vc, i) => {
                    const c = cityById.get(vc.city_id);
                    return (
                      <View key={vc.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {i > 0 && (
                          <MaterialCommunityIcons
                            name={(TRANSPORT_ICON[(vc.transport ?? 'other') as TransportMode] ?? 'arrow-right') as any}
                            size={14}
                            color="#666"
                            style={{ marginHorizontal: 4 }}
                          />
                        )}
                        <Text style={{ fontSize: 12 }}>{c?.name ?? vc.city_id}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 64, opacity: 0.6 }}>No visits yet</Text>}
      />
      <FAB icon="plus" style={{ position: 'absolute', right: 16, bottom: 16 }} onPress={() => nav.navigate('AddVisit')} />
    </View>
  );
}
