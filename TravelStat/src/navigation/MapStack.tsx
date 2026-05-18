import { createStackNavigator } from '@react-navigation/stack';
import MapScreen from '@/screens/MapScreen';
import CityDetailScreen, { type CityDetailParams } from '@/screens/CityDetailScreen';

export type MapStackParamList = {
  Map: undefined;
  CityDetail: CityDetailParams;
};

const Stack = createStackNavigator<MapStackParamList>();

export default function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CityDetail" component={CityDetailScreen} options={{ title: 'City' }} />
    </Stack.Navigator>
  );
}
