import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight, CircleHelp as HelpCircle, Info, Lock, LogOut, Moon, Palette, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

function SettingsSection({ title, children }: SettingsSectionProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
        {children}
      </View>
    </View>
  );
}

type SettingsItemProps = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
};

function SettingsItem({
  icon,
  label,
  value,
  onPress,
  rightElement,
}: SettingsItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={[styles.item, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.itemContent}>
        {icon}
        <View style={styles.itemTextContainer}>
          <Text style={[styles.itemLabel, { color: colors.text }]}>{label}</Text>
          {value && (
            <Text style={[styles.itemValue, { color: colors.textSecondary }]}>
              {value}
            </Text>
          )}
        </View>
      </View>
      {rightElement || (onPress && <ChevronRight size={20} color={colors.icon} />)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { session } = useAuth();
  const { colors, isDark, colorScheme, setColorScheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/sign-in');
  };

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.signInPrompt}>
          <User size={48} color={colors.primary} />
          <Text style={[styles.signInTitle, { color: colors.text }]}>
            Sign In Required
          </Text>
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>
            Please sign in to access settings
          </Text>
          <Pressable
            style={[styles.signInButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/auth/sign-in')}>
            <Text style={[styles.signInButtonText, { color: colors.surface }]}>
              Sign In
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <SettingsSection title="Account">
        <SettingsItem
          icon={<User size={20} color={colors.icon} />}
          label="Edit Profile"
          onPress={() => router.push('/profile/edit')}
        />
        <SettingsItem
          icon={<Lock size={20} color={colors.icon} />}
          label="Change Password"
          onPress={() => router.push('/auth/change-password')}
        />
      </SettingsSection>

      <SettingsSection title="Appearance">
        <SettingsItem
          icon={<Moon size={20} color={colors.icon} />}
          label="Dark Mode"
          rightElement={
            <Switch
              value={isDark}
              onValueChange={(value) =>
                setColorScheme(value ? 'dark' : 'light')
              }
            />
          }
        />
        <SettingsItem
          icon={<Palette size={20} color={colors.icon} />}
          label="Theme"
          value={colorScheme === 'system' ? 'System' : colorScheme === 'dark' ? 'Dark' : 'Light'}
          onPress={() => {
            const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
            const currentIndex = themes.indexOf(colorScheme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            setColorScheme(nextTheme);
          }}
        />
      </SettingsSection>

      <SettingsSection title="Support">
        <SettingsItem
          icon={<HelpCircle size={20} color={colors.icon} />}
          label="Help Center"
          onPress={() => Linking.openURL('https://example.com/help')}
        />
        <SettingsItem
          icon={<Info size={20} color={colors.icon} />}
          label="About"
          onPress={() => router.push('/about')}
        />
      </SettingsSection>

      <View style={styles.signOutContainer}>
        <Pressable
          style={[styles.signOutButton, { backgroundColor: colors.error }]}
          onPress={handleSignOut}>
          <LogOut size={20} color="#ffffff" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 60,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 16,
  },
  sectionContent: {
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  itemTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  itemLabel: {
    fontSize: 16,
  },
  itemValue: {
    fontSize: 14,
    marginTop: 2,
  },
  signOutContainer: {
    padding: 16,
    marginBottom: 32,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  signInText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});