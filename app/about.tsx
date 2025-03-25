import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowLeft, Github, Globe, Mail, Twitter } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Constants from 'expo-constants';

const SOCIAL_LINKS = [
  {
    icon: Globe,
    label: 'Website',
    url: 'https://example.com',
  },
  {
    icon: Github,
    label: 'GitHub',
    url: 'https://github.com/example/events-app',
  },
  {
    icon: Twitter,
    label: 'Twitter',
    url: 'https://twitter.com/example',
  },
  {
    icon: Mail,
    label: 'Contact',
    url: 'mailto:support@example.com',
  },
];

export default function AboutScreen() {
  const { colors } = useTheme();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            Back
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={[styles.appName, { color: colors.text }]}>
            Events App
          </Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>
            Version {Constants.expoConfig?.version || '1.0.0'}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Events App is a modern platform for discovering, creating, and managing events. 
            Connect with your community, find interesting events near you, and create 
            memorable experiences.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Connect With Us
          </Text>
          <View style={styles.socialLinks}>
            {SOCIAL_LINKS.map((link) => (
              <Pressable
                key={link.label}
                style={[styles.socialLink, { backgroundColor: colors.background }]}
                onPress={() => handleOpenLink(link.url)}>
                <link.icon size={20} color={colors.primary} />
                <Text style={[styles.socialLinkText, { color: colors.text }]}>
                  {link.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Legal
          </Text>
          <Pressable
            style={styles.legalLink}
            onPress={() => handleOpenLink('https://example.com/privacy')}>
            <Text style={[styles.legalLinkText, { color: colors.primary }]}>
              Privacy Policy
            </Text>
          </Pressable>
          <Pressable
            style={styles.legalLink}
            onPress={() => handleOpenLink('https://example.com/terms')}>
            <Text style={[styles.legalLinkText, { color: colors.primary }]}>
              Terms of Service
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.copyright, { color: colors.textSecondary }]}>
          © {new Date().getFullYear()} Events App. All rights reserved.
        </Text>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  version: {
    fontSize: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  socialLinkText: {
    fontSize: 16,
    fontWeight: '500',
  },
  legalLink: {
    paddingVertical: 12,
  },
  legalLinkText: {
    fontSize: 16,
    fontWeight: '500',
  },
  copyright: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
});