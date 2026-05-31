import {
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';
import { unregisterPushNotifications } from '../services/pushNotifications';
import { useState } from 'react';


interface DrawerLink {
  label: string;
  icon: string;
  route: string;
}

interface Props {
  links: DrawerLink[];
  state?: any;
  navigation?: any;
}

export default function DrawerContent(props: Props & { links: DrawerLink[] }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const currentRoute = props.state?.routeNames?.[props.state?.index];

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Évite double-tap
    setIsLoggingOut(true);

    try {
      await unregisterPushNotifications().catch(() => {});
      await logout();
      router.replace('/(auth)/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.container}
      >
        {/* Header avec avatar gradient en disque */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#0066FF', '#6B3FE0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </LinearGradient>

          <Text style={styles.name} numberOfLines={1}>
            {user?.fullName}
          </Text>
          <Text style={styles.phone}>{user?.phone}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {user?.role === 'WASHER' ? '🧽 Laveur' : '👤 Client'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Liens de navigation */}
        <View style={styles.linksSection}>
          {props.links.map((link) => {
            const linkName = link.route.split('/').filter(Boolean).pop();
            const isActive = currentRoute === linkName;
            return (
              <Pressable
                key={link.route}
                style={[styles.linkItem, isActive && styles.linkItemActive]}
                onPress={() => {
                  props.navigation?.closeDrawer?.();
                  router.push(link.route as any);
                }}
              >
                <Text style={styles.linkIcon}>{link.icon}</Text>
                <Text style={[styles.linkLabel, isActive && styles.linkLabelActive]}>
                  {link.label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </Pressable>
            );
          })}
        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.logoutBtn, isLoggingOut && { opacity: 0.5 }]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutLabel}>
            {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
          </Text>
        </Pressable>
        <Text style={styles.appVersion}>WashGo · v1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 0, flexGrow: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
  },
  name: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
  },
  phone: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  roleBadgeText: {
    color: '#0066FF',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 4,
  },
  linksSection: {
    paddingTop: 8,
    paddingHorizontal: 8,
    flex: 1,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 4,
    position: 'relative',
  },
  linkItemActive: { backgroundColor: '#F0F4FF' },
  linkIcon: { fontSize: 20, marginRight: 14, width: 24 },
  linkLabel: { fontSize: 15, fontWeight: '500', color: '#333' },
  linkLabelActive: { color: '#0066FF', fontWeight: '700' },
  activeIndicator: {
    position: 'absolute',
    right: 8,
    top: '50%',
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#0066FF',
    marginTop: -9,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutIcon: { fontSize: 20, marginRight: 14, width: 24 },
  logoutLabel: { fontSize: 15, fontWeight: '500', color: '#FF3B30' },
  appVersion: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
});