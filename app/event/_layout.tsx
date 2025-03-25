import { Stack } from 'expo-router';

export default function EventLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide-from-right',
      }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/edit" />
    </Stack>
  );
}