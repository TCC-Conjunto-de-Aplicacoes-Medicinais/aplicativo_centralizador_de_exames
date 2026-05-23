import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Mail, RefreshCw, ArrowRight, CheckCircle } from 'lucide-react-native';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useCustomAlert } from '@/context/AlertContext';

import { authenticatedRequest, refresh } from '@/services/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function VerifyEmailCodeScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshEmailStatus } = useApp();
  const { showAlert } = useCustomAlert();

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleVerify = async () => {
    if (!code.trim() || isVerifying) return;

    Keyboard.dismiss();
    setIsVerifying(true);

    try {
      const verifyUrl = `${API_BASE_URL}/api/users/verify-email-code`;
      await authenticatedRequest(verifyUrl, {
        method: 'POST',
        data: { code: code.trim() },
        headers: { 'Content-Type': 'application/json' },
      });

      // Email verificado com sucesso no backend.
      // Renovamos o access token para obter o novo claim email_verified = true
      try {
        await refresh();
        await refreshEmailStatus();
      } catch (refreshErr) {
        console.log('[VERIFY CODE REFRESH TOKEN ERROR]', refreshErr);
      }

      showAlert('Sucesso ✅', 'E-mail verificado com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (err: any) {
      const backendMsg = err?.response?.data?.error;
      const message = backendMsg || err?.message || 'Código inválido ou expirado.';
      console.log('[VERIFY CODE ERROR]', message);

      showAlert('Erro ao verificar', message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      const verifyUrl = `${API_BASE_URL}/api/users/send-verify-email`;
      await authenticatedRequest(verifyUrl, { method: 'POST' });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err: any) {
      console.log('[RESEND ERROR]', err?.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
          {/* Ícone e Título */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.headerSection}>
            <View style={styles.iconCircle}>
              <Mail color="#0d9488" size={32} />
            </View>
            <Text style={styles.title}>Verifique seu e-mail</Text>
            <Text style={styles.subtitle}>
              Enviamos um e-mail de verificação. Insira o código recebido ou clique no link enviado.
            </Text>
          </Animated.View>

          {/* Campo de código */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.formSection}>
            <Text style={styles.inputLabel}>Código de Verificação</Text>
            <View style={styles.codeInputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.codeInput}
                placeholder="Digite o código aqui"
                placeholderTextColor="#94a3b8"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
              />
            </View>

            {/* Botão Verificar */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (!code.trim() || isVerifying) && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              activeOpacity={0.85}
              disabled={!code.trim() || isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.verifyButtonText}>Verificar</Text>
                  <ArrowRight color="#ffffff" size={18} />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Divisor */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.dividerSection}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Reenviar e-mail */}
          <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.resendSection}>
            <Text style={styles.resendInfo}>
              Não recebeu o e-mail? Verifique sua pasta de spam ou solicite um novo envio.
            </Text>

            <TouchableOpacity
              style={[styles.resendButton, isResending && styles.resendButtonDisabled]}
              onPress={handleResendEmail}
              activeOpacity={0.7}
              disabled={isResending}
            >
              {resendSuccess ? (
                <>
                  <CheckCircle color="#059669" size={18} />
                  <Text style={[styles.resendButtonText, { color: '#059669' }]}>E-mail reenviado!</Text>
                </>
              ) : (
                <>
                  <RefreshCw color="#0d9488" size={18} />
                  <Text style={styles.resendButtonText}>
                    {isResending ? 'Enviando...' : 'Reenviar e-mail'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Nota informativa */}
          <Animated.View entering={FadeIn.delay(800).duration(600)} style={styles.noteSection}>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
                💡 Após verificar seu e-mail, você terá acesso a recursos adicionais de segurança e notificações.
              </Text>
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  // --- Header ---
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.card === '#ffffff' ? '#f0fdfa' : theme.border,
    borderWidth: 2,
    borderColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  // --- Form ---
  formSection: {
    gap: 12,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  codeInputContainer: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  codeInput: {
    height: 52,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    height: 50,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // --- Divisor ---
  dividerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },

  // --- Reenviar ---
  resendSection: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  resendInfo: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 10,
    backgroundColor: theme.card === '#ffffff' ? '#f0fdfa' : theme.background,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },

  // --- Nota ---
  noteSection: {
    marginTop: 8,
  },
  noteCard: {
    backgroundColor: theme.card === '#ffffff' ? '#f0f9ff' : theme.border,
    borderWidth: 1,
    borderColor: theme.card === '#ffffff' ? '#bae6fd' : theme.primary,
    borderRadius: 12,
    padding: 14,
  },
  noteText: {
    fontSize: 13,
    color: theme.card === '#ffffff' ? '#0369a1' : theme.text,
    lineHeight: 20,
    textAlign: 'center',
  },
});
