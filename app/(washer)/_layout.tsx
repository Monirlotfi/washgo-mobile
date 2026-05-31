import { Drawer } from 'expo-router/drawer';
import DrawerContent from '../../src/components/DrawerContent';

const WASHER_LINKS = [
  { label: 'Dashboard', icon: '🏠', route: '/(washer)/dashboard' },
  { label: 'Mes offres', icon: '💰', route: '/(washer)/my-offers' },
  { label: 'Mes gains', icon: '📊', route: '/(washer)/earnings' },
  { label: 'Profil', icon: '👤', route: '/(washer)/profile' },
];

export default function WasherLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerStyle: { width: 280 } }}
      drawerContent={(props) => (
        <DrawerContent {...props} links={WASHER_LINKS} />
      )}
    >
      <Drawer.Screen name="dashboard" />
      <Drawer.Screen name="my-offers" />
      <Drawer.Screen name="earnings" />
      <Drawer.Screen name="profile" />
      <Drawer.Screen name="booking/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}