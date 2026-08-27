import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function EmployerNavigation() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const employer = useAuthStore((state) => state.employer);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'E';
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Employer';

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path as never);
  };

  const logout = () => {
    setOpen(false);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          clearSession();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <>
      <Pressable accessibilityLabel="Open employer menu" style={styles.menuButton} onPress={() => setOpen(true)}>
        <Text style={styles.menuIcon}>☰</Text>
      </Pressable>

      {open && (
        <View style={styles.layer} pointerEvents="box-none">
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <SafeAreaView style={styles.drawer}>
            <View style={styles.profileHeader}>
              {user?.profilePhotoUrl ? (
                <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
              )}
              <View style={styles.profileCopy}>
                <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
                <Text style={styles.company} numberOfLines={1}>{employer?.companyName || 'Employer account'}</Text>
                <Text style={styles.role}>EMPLOYER</Text>
              </View>
              <Pressable accessibilityLabel="Close employer menu" onPress={() => setOpen(false)} style={styles.closeButton}>
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <NavItem icon="⌂" label="Dashboard" onPress={() => navigate('/employer-home')} />
            <NavItem icon="▣" label="My Jobs" onPress={() => navigate('/employer-jobs')} />
            <NavItem icon="♙" label="Applications" onPress={() => navigate('/employer-applications')} />
            <NavItem icon="₹" label="My Subscription" onPress={() => navigate('/employer-subscription')} />
            <NavItem icon="▤" label="Payment Methods" onPress={() => navigate('/employer-payment-method')} />
            <NavItem icon="⚙" label="Settings" onPress={() => navigate('/employer-settings')} />
            <NavItem icon="◉" label="Profile" onPress={() => navigate('/employer-profile')} />

            <View style={styles.bottomArea}>
              {(user?.roles ?? []).includes('WORKER') && (
                <NavItem
                  icon="⇄"
                  label="Switch to Worker"
                  onPress={() => {
                    setOpen(false);
                    setActiveRole('WORKER');
                    router.replace('/home');
                  }}
                />
              )}
              <Pressable style={styles.logout} onPress={logout}>
                <Text style={styles.logoutIcon}>↪</Text>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      )}
    </>
  );
}

function NavItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.item, pressed && styles.itemPressed]} onPress={onPress}>
      <Text style={styles.itemIcon}>{icon}</Text>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 50,
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: BrandColors.slateSoft,
    borderWidth: 1,
    borderColor: BrandColors.slateBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: { color: BrandColors.gold, fontSize: 24, fontWeight: '800', lineHeight: 25 },
  layer: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },
  drawer: {
    width: 292,
    maxWidth: '84%',
    height: '100%',
    backgroundColor: BrandColors.background,
    borderRightWidth: 1,
    borderRightColor: BrandColors.gold,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 8, height: 0 },
    elevation: 18,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingBottom: 16 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: BrandColors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BrandColors.slate, fontSize: 18, fontWeight: '900' },
  profileCopy: { flex: 1, marginLeft: 12 },
  name: { color: BrandColors.text, fontSize: 16, fontWeight: '900' },
  company: { color: BrandColors.textSecondary, fontSize: 12, marginTop: 3 },
  role: { color: BrandColors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginTop: 5 },
  closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  close: { color: BrandColors.textSecondary, fontSize: 28, lineHeight: 28 },
  divider: { height: 1, backgroundColor: BrandColors.slateBorder, marginBottom: 10 },
  item: { minHeight: 52, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 4 },
  itemPressed: { backgroundColor: BrandColors.slateSoft },
  itemIcon: { width: 30, color: BrandColors.gold, fontSize: 19, textAlign: 'center', fontWeight: '800' },
  itemLabel: { flex: 1, color: BrandColors.text, fontSize: 14, fontWeight: '700', marginLeft: 10 },
  chevron: { color: BrandColors.muted, fontSize: 22 },
  bottomArea: { marginTop: 'auto', paddingBottom: 10, borderTopWidth: 1, borderTopColor: BrandColors.slateBorder, paddingTop: 10 },
  logout: { minHeight: 52, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 4 },
  logoutIcon: { width: 30, color: '#E58B8B', fontSize: 21, textAlign: 'center', fontWeight: '900' },
  logoutText: { color: '#E58B8B', fontSize: 14, fontWeight: '800', marginLeft: 10 },
});
