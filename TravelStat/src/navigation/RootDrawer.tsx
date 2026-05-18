import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from '@/screens/HomeScreen';
import MapScreen from '@/screens/MapScreen';
import WishlistScreen from '@/screens/WishlistScreen';
import TimelineScreen from '@/screens/TimelineScreen';
import StatisticsScreen from '@/screens/StatisticsScreen';
import AchievementsScreen from '@/screens/AchievementsScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Drawer = createDrawerNavigator();

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const icon = (name: IconName) =>
  ({ color, size }: { color: string; size: number }) =>
    <MaterialCommunityIcons name={name} color={color} size={size} />;

export default function RootDrawer() {
  return (
    <Drawer.Navigator initialRouteName="Home">
      <Drawer.Screen name="Home"         component={HomeScreen}         options={{ drawerIcon: icon('home') }} />
      <Drawer.Screen name="Map"          component={MapScreen}          options={{ drawerIcon: icon('map') }} />
      <Drawer.Screen name="Wishlist"     component={WishlistScreen}     options={{ drawerIcon: icon('heart-outline') }} />
      <Drawer.Screen name="Timeline"     component={TimelineScreen}     options={{ drawerIcon: icon('timeline') }} />
      <Drawer.Screen name="Statistics"   component={StatisticsScreen}   options={{ drawerIcon: icon('chart-bar') }} />
      <Drawer.Screen name="Achievements" component={AchievementsScreen} options={{ drawerIcon: icon('trophy-outline') }} />
      <Drawer.Screen name="Settings"     component={SettingsScreen}     options={{ drawerIcon: icon('cog-outline') }} />
    </Drawer.Navigator>
  );
}
