import { Drawer } from 'expo-router/drawer';
import DrawerContent from '../../src/components/DrawerContent';

const CLIENT_LINKS = [
  { label: 'Accueil', icon: '🏠', route: '/(client)/home' },
  { label: 'Mes lavages', icon: '📋', route: '/(client)/history' },
  { label: 'Profil', icon: '👤', route: '/(client)/profile' },
];

export default function ClientLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerStyle: { width: 280 } }}
      drawerContent={(props) => (
        <DrawerContent {...props} links={CLIENT_LINKS} />
      )}
    >
      <Drawer.Screen name="home" />
      <Drawer.Screen name="history" />
      <Drawer.Screen name="profile" />
      <Drawer.Screen name="new-booking" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="add-vehicle" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="booking/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}