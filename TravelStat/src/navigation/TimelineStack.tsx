import { createStackNavigator } from '@react-navigation/stack';
import TimelineScreen from '@/screens/TimelineScreen';
import AddVisitScreen from '@/screens/AddVisitScreen';

export type TimelineStackParamList = {
  Timeline: undefined;
  AddVisit: undefined;
};

const Stack = createStackNavigator<TimelineStackParamList>();

export default function TimelineStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Timeline" component={TimelineScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddVisit" component={AddVisitScreen} options={{ title: 'Add visit' }} />
    </Stack.Navigator>
  );
}
