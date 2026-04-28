import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. Tela de Login (index = rota raiz do app) */}
      <Stack.Screen name="index" />

      {/* 2. O grupo de abas (tela de dev) */}
      <Stack.Screen name="(tabs)" />

      {/* 3. O fluxo de exames (Sobrepõe as abas quando chamado) */}
      <Stack.Screen name="exam-flow" />
    </Stack>
  );
}