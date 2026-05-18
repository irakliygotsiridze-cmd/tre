import { useState } from 'react';
import { View, Alert } from 'react-native';
import { Button, RadioButton, Text } from 'react-native-paper';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useMediaStore } from '@/store/useMediaStore';
import { useAchievementsStore } from '@/store/useAchievementsStore';
import { getDb } from '@/database/client';
import { runMigrations } from '@/database/migrations';
import { CURRENCIES } from '@/utils/currency';
import { purgeAllMedia } from '@/services/media';

export default function SettingsScreen() {
  const baseCurrency = useSettingsStore(s => s.baseCurrency);
  const setBaseCurrency = useSettingsStore(s => s.setBaseCurrency);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    try {
      const db = await getDb();
      await db.execAsync(`
        DROP TABLE IF EXISTS countries;
        DROP TABLE IF EXISTS cities;
        DROP TABLE IF EXISTS visits;
        DROP TABLE IF EXISTS media;
        DROP TABLE IF EXISTS achievements;
        DROP TABLE IF EXISTS meta;
      `);
      await purgeAllMedia();
      await runMigrations();
      await Promise.all([
        useCountriesStore.getState().loadFromDb(),
        useCitiesStore.getState().loadFromDb(),
        useVisitsStore.getState().loadFromDb(),
        useMediaStore.getState().loadFromDb(),
        useAchievementsStore.getState().loadFromDb(),
        useSettingsStore.getState().loadFromDb(),
      ]);
      useCitiesStore.getState().setWithMedia(new Set());
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="titleMedium">Base currency</Text>
      <RadioButton.Group onValueChange={v => setBaseCurrency(v)} value={baseCurrency}>
        {CURRENCIES.map(c => (
          <RadioButton.Item key={c} label={c} value={c} />
        ))}
      </RadioButton.Group>

      <Text variant="titleMedium" style={{ marginTop: 24 }}>Danger zone</Text>
      <Button
        mode="outlined"
        onPress={() =>
          Alert.alert('Reset all data?', 'This deletes all visits, media, and achievements.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: reset },
          ])
        }
        disabled={busy}
        style={{ marginTop: 8 }}
      >
        Reset all data
      </Button>
    </View>
  );
}
