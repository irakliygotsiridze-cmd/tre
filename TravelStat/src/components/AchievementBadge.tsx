import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fmtDate } from '@/utils/dates';
import type { AchievementDef, AchievementState } from '@/utils/types';

interface Props {
  def: AchievementDef;
  state: AchievementState | undefined;
}

export default function AchievementBadge({ def, state }: Props) {
  const unlocked = state?.unlocked;
  return (
    <Card style={[styles.card, !unlocked && { opacity: 0.45 }]}>
      <Card.Content style={styles.inner}>
        <MaterialCommunityIcons
          name={def.icon as any}
          size={36}
          color={unlocked ? '#34C759' : '#888'}
        />
        <Text variant="titleMedium" style={{ marginTop: 8 }}>{def.name}</Text>
        <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 4 }}>{def.description}</Text>
        {unlocked && state?.unlocked_at && (
          <Text variant="labelSmall" style={{ marginTop: 6, opacity: 0.7 }}>
            {fmtDate(state.unlocked_at)}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6 },
  inner: { alignItems: 'center', paddingVertical: 12 },
});
