import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout() {
  useFrameworkReady();
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
              animation: 'fade',
            }}
          />
        ) : (
          <>
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="event/[id]"
              options={{
                headerShown: false,
                animation: 'slide-from-right',
              }}
            />
            <Stack.Screen
              name="profile/[id]"
              options={{
                headerShown: false,
                animation: 'slide-from-right',
              }}
            />
            <Stack.Screen
              name="about"
              options={{
                headerShown: false,
                animation: 'slide-from-right',
              }}
            />
          </>
        )}
        <Stack.Screen
          name="+not-found"
          options={{
            presentation: 'modal',
            animation: 'fade',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}