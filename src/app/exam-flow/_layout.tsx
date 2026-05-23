import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withTiming, Easing, FadeIn, FadeOut } from 'react-native-reanimated';
import { Bell, ArrowLeft, Key, Settings, Mail, X } from 'lucide-react-native';

// Importações do seu projeto
import { AppProvider, useApp } from '@/context/AppContext';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { useCustomAlert } from '@/context/AlertContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- COMPONENTE DO POPUP DE VERIFICAÇÃO DE EMAIL ---
function EmailVerifyPopup({ visible, onClose, onGoToSettings }: {
  visible: boolean;
  onClose: () => void;
  onGoToSettings: () => void;
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.popupOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.popupContainer}>
          {/* Seta apontando para cima (direção do ícone) */}
          <View style={styles.popupArrow} />

          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.popupCard}>
              {/* Header do popup */}
              <View style={styles.popupHeader}>
                <View style={styles.popupIconCircle}>
                  <Mail color="#f59e0b" size={20} />
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X color="#94a3b8" size={18} />
                </TouchableOpacity>
              </View>

              {/* Conteúdo */}
              <Text style={styles.popupTitle}>Confirme seu e-mail</Text>
              <Text style={styles.popupMessage}>
                Confirme seu e-mail para garantir a segurança da sua conta e receber notificações importantes.
              </Text>

              {/* Botão de ação */}
              <TouchableOpacity
                style={styles.popupButton}
                onPress={onGoToSettings}
                activeOpacity={0.8}
              >
                <Settings color="#ffffff" size={16} />
                <Text style={styles.popupButtonText}>Ir para Configurações</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// --- COMPONENTE DO CABEÇALHO CUSTOMIZADO ---
function CustomHeader({ route, navigation }: any) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { showAlert } = useCustomAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount, emailVerified, givenName } = useApp();
  const [showTransition, setShowTransition] = useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);

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

  // Mostra o popup de verificação de email após 2s na Home (apenas uma vez)
  useEffect(() => {
    if (isHomePage && !emailVerified && !popupDismissed) {
      const timer = setTimeout(() => {
        setShowEmailPopup(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isHomePage, emailVerified, popupDismissed]);

  const handleAuthenticator = () => {
    showAlert('Autenticador', 'Gerar código de acesso seguro');
  };

  const handleSettings = () => {
    router.push('/exam-flow/settings');
  };

  const handleDismissPopup = () => {
    setShowEmailPopup(false);
    setPopupDismissed(true);
  };

  const handleGoToSettingsFromPopup = () => {
    setShowEmailPopup(false);
    setPopupDismissed(true);
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
    top: 0,
    bottom: 0,
    justifyContent: 'center',
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
            <ArrowLeft color={theme.text} size={24} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          {isHomePage ? (
            <>
              {/* Versão inicial: Bem vinda */}
              <Animated.View style={title1Style} pointerEvents={showTransition ? 'none' : 'auto'}>
                <Text style={styles.titleTextWhite} numberOfLines={1} adjustsFontSizeToFit>Bem vindo(a), {givenName} 👋</Text>
                <Text style={styles.subtitleTextWhite}>Gerencie seus registros médicos</Text>
              </Animated.View>

              {/* Versão final: Maria */}
              <Animated.View style={title2Style} pointerEvents={showTransition ? 'auto' : 'none'}>
                <Text style={styles.titleTextWhite} numberOfLines={1} adjustsFontSizeToFit>{givenName}</Text>
                <Text style={styles.subtitleTextWhite}>Meus Exames</Text>
              </Animated.View>
            </>
          ) : (
            <View style={styles.staticTitleContainer}>
              <Text style={styles.titleTextDark} numberOfLines={1} adjustsFontSizeToFit>
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
            <Key color={isHomePage ? theme.headerText : theme.text} size={24} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {/* setNotificationOpen(true) */}} style={styles.actionButton}>
            <Bell color={isHomePage ? theme.headerText : theme.text} size={24} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSettings} style={styles.actionButton}>
            <Settings color={isHomePage ? theme.headerText : theme.text} size={24} />
            {/* Bolinha vermelha sem número quando email não verificado */}
            {!emailVerified && (
              <View style={styles.redDot} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Se for Home, renderiza com Gradiente. Se não, fundo Branco com borda.
  if (isHomePage) {
    return (
      <>
        <LinearGradient
          colors={theme.headerBackground}
          style={[styles.headerContainer, { paddingTop: insets.top }]}
        >
          {renderHeaderContent()}
        </LinearGradient>
        <EmailVerifyPopup
          visible={showEmailPopup}
          onClose={handleDismissPopup}
          onGoToSettings={handleGoToSettingsFromPopup}
        />
      </>
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
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <AppProvider>
      {/* O Stack do Expo Router gerencia as páginas, e nós injetamos nosso cabeçalho customizado nele */}
      <Stack
        screenOptions={{
          header: (props) => <CustomHeader {...props} />,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="home" />
        <Stack.Screen name="exam/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="verify-email-code" />
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
const getStyles = (theme: ThemeColors) => StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerWhite: {
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
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
    justifyContent: 'center',
    paddingRight: 16,
  },
  staticTitleContainer: {
    justifyContent: 'center',
  },
  titleTextWhite: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.headerText,
  },
  subtitleTextWhite: {
    fontSize: 14,
    color: theme.headerText === '#ffffff' ? '#ecfdf5' : theme.textSecondary,
  },
  titleTextDark: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
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
    backgroundColor: theme.danger,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.card,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  redDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.danger,
    borderWidth: 1.5,
    borderColor: theme.card,
  },

  // --- Popup de verificação de email ---
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  popupContainer: {
    position: 'absolute',
    top: 100,
    right: 16,
    alignItems: 'flex-end',
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 320,
  },
  popupArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: theme.card,
    marginRight: 14,
    marginBottom: -1,
  },
  popupCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  popupIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card === '#ffffff' ? '#fef3c7' : '#451a03',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 6,
  },
  popupMessage: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  popupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    height: 44,
    borderRadius: 12,
    gap: 8,
  },
  popupButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Estilos do Modal Placeholder
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: 300,
  },
});