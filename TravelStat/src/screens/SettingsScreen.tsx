import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function SettingsScreen() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
      <Text variant="headlineMedium">Settings</Text>
    </View>
  );
}
