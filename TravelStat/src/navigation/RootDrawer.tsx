import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from '@/screens/HomeScreen';
import MapStack from '@/navigation/MapStack';
import WishlistScreen from '@/screens/WishlistScreen';
import TimelineStack from '@/navigation/TimelineStack';
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
      <Drawer.Screen name="Map"          component={MapStack}           options={{ drawerIcon: icon('map') }} />
      <Drawer.Screen name="Wishlist"     component={WishlistScreen}     options={{ drawerIcon: icon('heart-outline') }} />
      <Drawer.Screen name="Timeline"     component={TimelineStack}      options={{ drawerIcon: icon('timeline') }} />
      <Drawer.Screen name="Statistics"   component={StatisticsScreen}   options={{ drawerIcon: icon('chart-bar') }} />
      <Drawer.Screen name="Achievements" component={AchievementsScreen} options={{ drawerIcon: icon('trophy-outline') }} />
      <Drawer.Screen name="Settings"     component={SettingsScreen}     options={{ drawerIcon: icon('cog-outline') }} />
    </Drawer.Navigator>
  );
}
