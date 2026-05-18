import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootDrawer from '@/navigation/RootDrawer';
import { runMigrations } from '@/database/migrations';
import { useCountriesStore } from '@/store/useCountriesStore';
import { useCitiesStore } from '@/store/useCitiesStore';
import { useVisitsStore } from '@/store/useVisitsStore';
import { useMediaStore } from '@/store/useMediaStore';
import { useAchievementsStore } from '@/store/useAchievementsStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await runMigrations();
        await Promise.all([
          useCountriesStore.getState().loadFromDb(),
          useCitiesStore.getState().loadFromDb(),
          useVisitsStore.getState().loadFromDb(),
          useMediaStore.getState().loadFromDb(),
          useAchievementsStore.getState().loadFromDb(),
          useSettingsStore.getState().loadFromDb(),
        ]);
        const byCity = useMediaStore.getState().byCity;
        useCitiesStore.getState().setWithMedia(new Set(byCity.keys()));
        setReady(true);
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    })();
  }, []);

  if (error) return <View style={{ flex: 1, padding: 24 }}><Text>DB error: {error}</Text></View>;
  if (!ready)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={MD3LightTheme}>
          <NavigationContainer>
            <RootDrawer />
          </NavigationContainer>
          <StatusBar style="auto" />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
