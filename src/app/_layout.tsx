import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* 1. O grupo de abas (Aparece ao abrir o app) */}
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      
      {/* 2. O seu fluxo de exames (Sobrepõe as abas quando chamado) */}
      <Stack.Screen 
        name="exam-flow" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}