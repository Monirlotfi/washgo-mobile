import {
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';
import { unregisterPushNotifications } from '../services/pushNotifications';
import { useState } from 'react';
import { useColors, AppColors } from '../theme/colors';


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
  const colors = useColors();
  const s = styles(colors);
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={s.container}
      >
        <View style={s.header}>
          <LinearGradient
            colors={['#0066FF', '#6B3FE0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.avatarCircle}
          >
            <Text style={s.avatarText}>
              {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </LinearGradient>

          <Text style={s.name} numberOfLines={1}>
            {user?.fullName}
          </Text>
          <Text style={s.phone}>{user?.phone}</Text>

          <View style={s.roleBadge}>
            <Text style={s.roleBadgeText}>
              {user?.role === 'WASHER' ? '🧽 Laveur' : '👤 Client'}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.linksSection}>
          {props.links.map((link) => {
            const linkName = link.route.split('/').filter(Boolean).pop();
            const isActive = currentRoute === linkName;
            return (
              <Pressable
                key={link.route}
                style={[s.linkItem, isActive && s.linkItemActive]}
                onPress={() => {
                  props.navigation?.closeDrawer?.();
                  router.push(link.route as any);
                }}
              >
                <Text style={s.linkIcon}>{link.icon}</Text>
                <Text style={[s.linkLabel, isActive && s.linkLabelActive]}>
                  {link.label}
                </Text>
                {isActive && <View style={s.activeIndicator} />}
              </Pressable>
            );
          })}
        </View>
      </DrawerContentScrollView>

      <View style={s.footer}>
        <Pressable 
          style={[s.logoutBtn, isLoggingOut && { opacity: 0.5 }]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text style={s.logoutIcon}>🚪</Text>
          <Text style={s.logoutLabel}>
            {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
          </Text>
        </Pressable>
        <Text style={s.appVersion}>WashGo · v1.0</Text>
      </View>
    </View>
  );
}

const styles = (colors: AppColors) => StyleSheet.create({
  container: { paddingTop: 0, flexGrow: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: colors.textOnPrimary,
    fontSize: 30,
    fontWeight: '700',
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  phone: {
    color: colors.textSecondary,
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
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
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
  linkLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  linkLabelActive: { color: colors.primary, fontWeight: '700' },
  activeIndicator: {
    position: 'absolute',
    right: 8,
    top: '50%',
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: -9,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: colors.background,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutIcon: { fontSize: 20, marginRight: 14, width: 24 },
  logoutLabel: { fontSize: 15, fontWeight: '500', color: colors.danger },
  appVersion: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
});