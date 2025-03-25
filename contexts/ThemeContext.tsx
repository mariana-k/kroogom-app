import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme, ColorScheme } from '@/hooks/useColorScheme';

type ThemeContextType = {
  isDark: boolean;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
  colors: typeof lightColors | typeof darkColors;
};

const lightColors = {
  // Base
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  divider: '#f1f5f9',

  // Brand
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',

  // States
  success: '#22c55e',
  error: '#ef4444',
  warning: '#eab308',

  // UI Elements
  card: '#ffffff',
  cardPressed: '#f8fafc',
  input: '#ffffff',
  inputBackground: '#f8fafc',
  icon: '#64748b',
  shadow: '#000000',
};

const darkColors = {
  // Base
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#334155',
  divider: '#1e293b',

  // Brand
  primary: '#818cf8',
  primaryLight: '#a5b4fc',
  primaryDark: '#6366f1',

  // States
  success: '#4ade80',
  error: '#f87171',
  warning: '#facc15',

  // UI Elements
  card: '#1e293b',
  cardPressed: '#334155',
  input: '#1e293b',
  inputBackground: '#334155',
  icon: '#94a3b8',
  shadow: '#000000',
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colorScheme: 'system',
  setColorScheme: async () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDark, colorScheme, setColorScheme, isLoading } = useColorScheme();

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colorScheme,
        setColorScheme,
        colors: isDark ? darkColors : lightColors,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}