import { Stack, useRouter } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { AlertProvider } from '@/context/AlertContext';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Raleway_900Black } from '@expo-google-fonts/raleway/900Black';
import { getToken } from '@/services/auth';

// Impede que a splash screen suma automaticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'index' | 'exam-flow'>('index');
  const router = useRouter();

  // Carrega as fontes customizadas
  const [fontsLoaded] = useFonts({
    Raleway_900Black,
  });

  // Esconde a barra de navegação do Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setPositionAsync('absolute');
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  // Verifica autenticação ANTES de renderizar qualquer tela
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[AUTH] Verificando sessão existente...');
        const token = await getToken();
        if (token) {
          console.log('[AUTH] Sessão válida encontrada, indo para home.');
          setInitialRoute('exam-flow');
        } else {
          console.log('[AUTH] Nenhuma sessão válida encontrada.');
          setInitialRoute('index');
        }
      } catch (err) {
        console.log('[AUTH] Erro ao verificar sessão:', err);
        setInitialRoute('index');
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();
  }, []);

  // Depois que o layout está montado e pronto, navega e esconde a splash
  useEffect(() => {
    if (!isReady || !fontsLoaded) return;

    if (initialRoute === 'exam-flow') {
      router.replace('/exam-flow/home');
    }

    // Pequeno delay para garantir que a navegação iniciou antes de esconder
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 150);
  }, [isReady, fontsLoaded]);

  // Não renderiza NADA até saber a rota e as fontes estarem carregadas
  if (!isReady || !fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AlertProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* 1. Tela de Login (index = rota raiz do app) */}
          <Stack.Screen name="index" />

          {/* 2. O grupo de abas (tela de dev) */}
          <Stack.Screen name="(tabs)" />

          {/* 3. O fluxo de exames (Sobrepõe as abas quando chamado) */}
          <Stack.Screen name="exam-flow" />
        </Stack>
      </AlertProvider>
    </ThemeProvider>
  );
}