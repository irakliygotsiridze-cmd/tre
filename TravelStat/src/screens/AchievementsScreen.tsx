import { ScrollView, View } from 'react-native';
import { useAchievementsStore } from '@/store/useAchievementsStore';
import AchievementBadge from '@/components/AchievementBadge';

export default function AchievementsScreen() {
  const defs = useAchievementsStore(s => s.definitions);
  const byId = useAchievementsStore(s => s.byId);

  const pairs: Array<[typeof defs[number], typeof defs[number] | undefined]> = [];
  for (let i = 0; i < defs.length; i += 2) pairs.push([defs[i], defs[i + 1]]);

  return (
    <ScrollView contentContainerStyle={{ padding: 8 }}>
      {pairs.map(([a, b], i) => (
        <View key={i} style={{ flexDirection: 'row' }}>
          <AchievementBadge def={a} state={byId[a.id]} />
          {b ? <AchievementBadge def={b} state={byId[b.id]} /> : <View style={{ flex: 1 }} />}
        </View>
      ))}
    </ScrollView>
  );
}
