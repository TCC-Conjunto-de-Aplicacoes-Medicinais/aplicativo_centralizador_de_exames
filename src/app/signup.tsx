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
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme, ThemeColors } from '@/context/ThemeContext';

import { signup } from '@/services/auth';

// --- Helpers ---

/** Formata CPF em tempo real: 123.456.789-01 */
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Extrai apenas dígitos do CPF formatado */
function extractCPFDigits(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

export default function SignupScreen() {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const gradientColors = isDarkMode ? ['#1e293b', '#0f172a', '#020617'] : ['#059669', '#0d9488', '#0f766e'];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Focus refs
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [cpfFocused, setCpfFocused] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const cpfRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

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

  const handleSignup = async () => {
    Keyboard.dismiss();
    setErrorMessage('');
    setSuccessMessage('');

    // Validações
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();
    const cpfDigits = extractCPFDigits(cpf);

    if (!trimmedName || !trimmedEmail || !trimmedPassword || !trimmedConfirm || !cpfDigits) {
      setErrorMessage('Preencha todos os campos');
      triggerShake();
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setErrorMessage('E-mail inválido');
      triggerShake();
      return;
    }

    if (trimmedPassword.length < 8) {
      setErrorMessage('Senha deve ter no mínimo 8 caracteres');
      triggerShake();
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setErrorMessage('As senhas não coincidem');
      triggerShake();
      return;
    }

    if (cpfDigits.length !== 11) {
      setErrorMessage('CPF deve ter 11 dígitos');
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      await signup(trimmedName, trimmedEmail, trimmedPassword, cpfDigits);
      setSuccessMessage('Conta criada com sucesso!');

      // Volta para o login após 1.5s
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err: any) {
      const message = err?.message || 'Erro ao cadastrar';

      if (message.includes('already exists') || message.includes('já existe') || message.includes('conflict')) {
        setErrorMessage('Este e-mail ou CPF já está cadastrado');
      } else if (message.includes('fetch') || message.includes('Network')) {
        setErrorMessage('Sem conexão com o servidor');
      } else if (message.includes('email') || message.includes('Email')) {
        setErrorMessage('E-mail inválido');
      } else if (message.includes('password') || message.includes('Password')) {
        setErrorMessage('Senha não atende os requisitos');
      } else {
        setErrorMessage(message);
      }

      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (t: string) => void,
    focused: boolean,
    setFocused: (f: boolean) => void,
    options?: {
      placeholder?: string;
      keyboardType?: TextInput['props']['keyboardType'];
      autoCapitalize?: TextInput['props']['autoCapitalize'];
      secureTextEntry?: boolean;
      returnKeyType?: TextInput['props']['returnKeyType'];
      ref?: React.RefObject<TextInput | null>;
      onSubmitEditing?: () => void;
      maxLength?: number;
    },
  ) => (
    <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        ref={options?.ref}
        style={styles.input}
        placeholder={options?.placeholder || ''}
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={value}
        onChangeText={onChangeText}
        keyboardType={options?.keyboardType || 'default'}
        autoCapitalize={options?.autoCapitalize ?? 'sentences'}
        autoCorrect={false}
        secureTextEntry={options?.secureTextEntry || false}
        returnKeyType={options?.returnKeyType || 'next'}
        onSubmitEditing={options?.onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={options?.maxLength}
      />
    </View>
  );

  return (
    <LinearGradient
      colors={gradientColors}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Botão Voltar */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft color="rgba(255,255,255,0.8)" size={22} />
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(700)}
            style={styles.headerSection}
          >
            <Text style={styles.pageTitle}>Criar Conta</Text>
            <Text style={styles.pageSubtitle}>
              Preencha seus dados para começar
            </Text>
          </Animated.View>

          {/* Mensagem de erro */}
          {errorMessage !== '' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.errorContainer}>
              <Animated.View style={errorAnimStyle}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </Animated.View>
            </Animated.View>
          )}

          {/* Mensagem de sucesso */}
          {successMessage !== '' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.successContainer}>
              <Text style={styles.successText}>{successMessage}</Text>
            </Animated.View>
          )}

          {/* Formulário */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(700)}
            style={styles.formSection}
          >
            {renderInput('Nome completo', name, setName, nameFocused, setNameFocused, {
              placeholder: 'Maria Silva',
              autoCapitalize: 'words',
              onSubmitEditing: () => emailRef.current?.focus(),
            })}

            {renderInput('E-mail', email, setEmail, emailFocused, setEmailFocused, {
              placeholder: 'seu@email.com',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
              ref: emailRef,
              onSubmitEditing: () => cpfRef.current?.focus(),
            })}

            {renderInput('CPF', cpf, (text) => setCpf(formatCPF(text)), cpfFocused, setCpfFocused, {
              placeholder: '000.000.000-00',
              keyboardType: 'numeric',
              ref: cpfRef,
              maxLength: 14, // 11 dígitos + 3 pontuação
              onSubmitEditing: () => passwordRef.current?.focus(),
            })}

            {renderInput('Senha', password, setPassword, passwordFocused, setPasswordFocused, {
              placeholder: 'Mínimo 8 caracteres',
              secureTextEntry: true,
              autoCapitalize: 'none',
              ref: passwordRef,
              onSubmitEditing: () => confirmRef.current?.focus(),
            })}

            {renderInput('Confirmar senha', confirmPassword, setConfirmPassword, confirmFocused, setConfirmFocused, {
              placeholder: 'Repita a senha',
              secureTextEntry: true,
              autoCapitalize: 'none',
              ref: confirmRef,
              returnKeyType: 'done',
              onSubmitEditing: handleSignup,
            })}
          </Animated.View>

          {/* Botão Cadastrar */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(700)}
            style={styles.buttonSection}
          >
            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={isDarkMode ? "#0f172a" : "#0f766e"} size="small" />
              ) : (
                <Text style={styles.signupButtonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>

            {/* Link para login */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Já tem conta? </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
                <Text style={styles.loginLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    gap: 24,
  },

  // --- Back ---
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },

  // --- Header ---
  headerSection: {
    gap: 6,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  pageSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },

  // --- Form ---
  formSection: {
    gap: 14,
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

  // --- Button ---
  buttonSection: {
    gap: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  signupButton: {
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
  signupButtonDisabled: {
    opacity: 0.85,
  },
  signupButtonText: {
    color: isDarkMode ? '#0f172a' : '#0f766e',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // --- Login link ---
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '400',
  },
  loginLink: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // --- Error / Success ---
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
  successContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  successText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
