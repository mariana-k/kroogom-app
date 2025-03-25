import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';

export type ColorScheme = 'light' | 'dark' | 'system';

const COLOR_SCHEME_KEY = '@color_scheme';

export function useColorScheme() {
  const systemColorScheme = useSystemColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadColorScheme();
  }, []);

  const loadColorScheme = async () => {
    try {
      const savedScheme = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
      if (savedScheme) {
        setColorScheme(savedScheme as ColorScheme);
      }
    } catch (error) {
      console.error('Error loading color scheme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setScheme = async (scheme: ColorScheme) => {
    try {
      await AsyncStorage.setItem(COLOR_SCHEME_KEY, scheme);
      setColorScheme(scheme);
    } catch (error) {
      console.error('Error saving color scheme:', error);
    }
  };

  const isDark = colorScheme === 'dark' || (colorScheme === 'system' && systemColorScheme === 'dark');

  return {
    colorScheme,
    setColorScheme: setScheme,
    isDark,
    isLoading,
  };
}