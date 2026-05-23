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
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Code2, Check } from 'lucide-react-native';

import { login } from '@/services/auth';

/** Formata CPF em tempo real: 123.456.789-01 */
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function LoginScreen() {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [cpfFocused, setCpfFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const passwordRef = useRef<TextInput>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();



  // Animação de shake no erro
  const errorShake = useSharedValue(0);
  const errorAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorShake.value }],
  }));

  const triggerShake = () => {
    errorShake.value = withSequence(
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    setErrorMessage('');

    // Validação básica
    const trimmedCpf = cpf.replace(/\D/g, '');
    const trimmedPassword = password.trim();

    if (!trimmedCpf || !trimmedPassword) {
      setErrorMessage('Preencha todos os campos');
      triggerShake();
      return;
    }

    if (trimmedCpf.length !== 11) {
      setErrorMessage('CPF inválido');
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      await login(trimmedCpf, trimmedPassword, rememberMe);
      // Login bem-sucedido — navega para o fluxo principal
      router.replace('/exam-flow/home');
    } catch (err: any) {
      const message = err?.message || 'Erro ao fazer login';
      console.log('[LOGIN ERROR]', message);

      // Traduz erros comuns do backend
      if (message.includes('credenciais inválidas') || message.includes('invalid_grant') || message.includes('Invalid user credentials')) {
        setErrorMessage('CPF ou senha incorretos');
      } else if (message.includes('validation') && message.includes('min') && message.includes('Password')) {
        setErrorMessage('A senha deve ter no mínimo 8 caracteres');
      } else if (message.includes('dpop') || message.includes('DPoP') || message.includes('JWT')) {
        setErrorMessage('Erro de segurança. Tente novamente.');
      } else if (message.includes('fetch') || message.includes('Network') || message.includes('ECONNREFUSED')) {
        setErrorMessage('Sem conexão com o servidor');
      } else {
        setErrorMessage(message);
      }

      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevAccess = () => {
    router.push('/dev-home');
  };



  return (
    <LinearGradient
      colors={['#059669', '#0d9488', '#0f766e']}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

            {/* Botão Dev — canto superior direito */}
            <Animated.View
              entering={FadeInUp.delay(800).duration(600)}
              style={[styles.devButtonWrapper, { top: insets.top + 8 }]}
            >
              <TouchableOpacity
                onPress={handleDevAccess}
                style={styles.devButton}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Code2 color="rgba(255,255,255,0.5)" size={20} />
              </TouchableOpacity>
            </Animated.View>

            {/* Conteúdo central */}
            <View style={styles.content}>
              {/* Logo + Título */}
              <Animated.View
                entering={FadeInDown.delay(200).duration(700)}
                style={styles.headerSection}
              >
                <View style={styles.logoContainer}>
                  <Image
                    source={require('@/assets/images/logo.png')}
                    style={styles.logo}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.brandTitle}>POHINC</Text>
                <Text style={styles.appTitle}>Centralizador de Exames</Text>
                <Text style={styles.appSubtitle}>Seus registros médicos em um só lugar</Text>
              </Animated.View>

              {/* Mensagem de erro */}
              {errorMessage !== '' && (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  style={[styles.errorContainer]}
                >
                  <Animated.View style={errorAnimStyle}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </Animated.View>
                </Animated.View>
              )}

              {/* Formulário */}
              <Animated.View
                entering={FadeInDown.delay(400).duration(700)}
                style={styles.formSection}
              >
                {/* Campo CPF */}
                <View
                  style={[
                    styles.inputWrapper,
                    cpfFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <Text style={styles.inputLabel}>CPF</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="000.000.000-00"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={cpf}
                    onChangeText={(text) => setCpf(formatCPF(text))}
                    keyboardType="numeric"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    onFocus={() => setCpfFocused(true)}
                    onBlur={() => setCpfFocused(false)}
                    maxLength={14}
                  />
                </View>

                {/* Campo Senha */}
                <View
                  style={[
                    styles.inputWrapper,
                    passwordFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <Text style={styles.inputLabel}>Senha</Text>
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                </View>

                {/* Link esqueceu senha */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Check size={14} color="#0f766e" />}
                    </View>
                    <Text style={styles.checkboxLabel}>Lembrar-me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
                    <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Botão Entrar */}
              <Animated.View
                entering={FadeInDown.delay(600).duration(700)}
                style={styles.buttonSection}
              >
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  activeOpacity={0.85}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#0f766e" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Entrar</Text>
                  )}
                </TouchableOpacity>

                {/* Texto de cadastro */}
                <View style={styles.signupRow}>
                  <Text style={styles.signupText}>Não tem conta? </Text>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/signup')}>
                    <Text style={styles.signupLink}>Cadastre-se</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 36,
  },

  // --- Dev Button ---
  devButtonWrapper: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  devButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Header / Logo ---
  headerSection: {
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  logo: {
    width: 96,
    height: 96,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  brandTitle: {
    fontFamily: 'Raleway_900Black',
    fontSize: 38,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: -4,
  },
  appSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontWeight: '400',
  },

  // --- Form ---
  formSection: {
    gap: 16,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  inputWrapperFocused: {
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    height: 40,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  checkboxLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPassword: {
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },

  // --- Login Button ---
  buttonSection: {
    gap: 20,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#ffffff',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.85,
  },
  loginButtonText: {
    color: '#0f766e',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // --- Error ---
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // --- Signup ---
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '400',
  },
  signupLink: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
