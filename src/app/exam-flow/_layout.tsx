import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Bell, ArrowLeft, Key, Settings } from 'lucide-react-native';

// Importações do seu projeto
import { AppProvider, useApp } from '@/context/AppContext';
// import { NotificationPanel } from './NotificationPanel'; // Descomente quando converter o painel

// --- COMPONENTE DO CABEÇALHO CUSTOMIZADO ---
function CustomHeader({ route, navigation }: any) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useApp(); // Pegando o contexto
  const [showTransition, setShowTransition] = useState(false);

  const isHomePage = route.name === 'home';
  const isSettingsPage = route.name === 'settings';
  const showBackButton = !isHomePage;

  // Lógica da animação de 10 segundos na Home
  useEffect(() => {
    if (isHomePage) {
      const timer = setTimeout(() => {
        setShowTransition(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isHomePage]);

  const handleAuthenticator = () => {
    Alert.alert('Autenticador', 'Gerar código de acesso seguro');
  };

  const handleSettings = () => {
    router.push('/exam-flow/settings');
  };

  // Animação da primeira mensagem saindo para cima
  const title1Style = useAnimatedStyle(() => ({
    opacity: withTiming(showTransition ? 0 : 1, { duration: 800 }),
    transform: [
      {
        translateY: withTiming(showTransition ? -20 : 0, {
          duration: 800,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        }),
      },
    ],
    position: 'absolute',
    left: 0,
    right: 0,
  }));

  // Animação da segunda mensagem entrando de baixo
  const title2Style = useAnimatedStyle(() => ({
    opacity: withTiming(showTransition ? 1 : 0, { duration: 800 }),
    transform: [
      {
        translateY: withTiming(showTransition ? 0 : 20, {
          duration: 800,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        }),
      },
    ],
    position: 'absolute',
    left: 0,
    right: 0,
  }));

  // O conteúdo principal do Header (Títulos e Back Button)
  const renderHeaderContent = () => (
    <View style={styles.headerContent}>
      {/* Lado Esquerdo (Voltar ou Títulos Animados) */}
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft color="#334155" size={24} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          {isHomePage ? (
            <>
              {/* Versão inicial: Bem vinda */}
              <Animated.View style={title1Style} pointerEvents={showTransition ? 'none' : 'auto'}>
                <Text style={styles.titleTextWhite}>Bem vinda, Maria 👋</Text>
                <Text style={styles.subtitleTextWhite}>Gerencie seus registros médicos</Text>
              </Animated.View>

              {/* Versão final: Maria */}
              <Animated.View style={title2Style} pointerEvents={showTransition ? 'auto' : 'none'}>
                <Text style={styles.titleTextWhite}>Maria</Text>
                <Text style={styles.subtitleTextWhite}>Meus Exames</Text>
              </Animated.View>
            </>
          ) : (
            <View style={styles.staticTitleContainer}>
              <Text style={styles.titleTextDark}>
                {isSettingsPage ? 'Configurações' : 'Detalhes do Exame'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Lado Direito (Ações) — oculto na tela de Configurações */}
      {!isSettingsPage && (
        <View style={styles.actionsSection}>
          <TouchableOpacity onPress={handleAuthenticator} style={styles.actionButton}>
            <Key color={isHomePage ? '#ffffff' : '#334155'} size={24} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {/* setNotificationOpen(true) */}} style={styles.actionButton}>
            <Bell color={isHomePage ? '#ffffff' : '#334155'} size={24} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSettings} style={styles.actionButton}>
            <Settings color={isHomePage ? '#ffffff' : '#334155'} size={24} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Se for Home, renderiza com Gradiente. Se não, fundo Branco com borda.
  if (isHomePage) {
    return (
      <LinearGradient
        colors={['#059669', '#0d9488']}
        style={[styles.headerContainer, { paddingTop: insets.top }]}
      >
        {renderHeaderContent()}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.headerContainer, styles.headerWhite, { paddingTop: insets.top }]}>
      {renderHeaderContent()}
    </View>
  );
}

// --- LAYOUT PRINCIPAL ---
export default function ExamFlowLayout() {
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <AppProvider>
      {/* O Stack do Expo Router gerencia as páginas, e nós injetamos nosso cabeçalho customizado nele */}
      <Stack
        screenOptions={{
          header: (props) => <CustomHeader {...props} />,
          contentStyle: { backgroundColor: '#f8fafc' }, // Fundo padrão (slate-50) para todas as telas
        }}
      >
        <Stack.Screen name="home" />
        <Stack.Screen name="exam/[id]" />
        <Stack.Screen name="settings" />
      </Stack>

      {/* Placeholder para o Painel de Notificações nativo (Modal/BottomSheet) */}
      <Modal visible={notificationOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text>Painel de Notificações</Text>
            <TouchableOpacity onPress={() => setNotificationOpen(false)}>
              <Text>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AppProvider>
  );
}

// --- ESTILOS NATIVOS ---
const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    // Sombra suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerWhite: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52, // Altura fixa para comportar a animação sem quebrar
    marginTop: 8,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    marginLeft: -4,
  },
  titleContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  staticTitleContainer: {
    justifyContent: 'center',
  },
  titleTextWhite: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitleTextWhite: {
    fontSize: 14,
    color: '#ecfdf5', // emerald-50
  },
  titleTextDark: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a', // slate-900
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444', // red-500
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff', // Borda para separar do sino
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Estilos do Modal Placeholder
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: 300,
  },
});