import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { Stack, Redirect } from 'expo-router';

export default function DevLayout() {
  const colorScheme = useColorScheme();
  const isDevEnabled = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_MENU === 'true';

  if (!isDevEnabled) {
    return <Redirect href="/" />;
  }
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="dev-home" />
        <Stack.Screen name="test-security" />
        <Stack.Screen name="test-ai" />
      </Stack>
    </ThemeProvider>
  );
}
