import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Brain, AlertTriangle, Sparkles, Lock, User, LogIn } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authenticatedRequest, login, isAuthenticated } from '@/services/auth';
import { useCustomAlert } from '@/context/AlertContext';

/** Formata CPF em tempo real: 123.456.789-01 */
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function TestAIScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { showAlert } = useCustomAlert();

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [disclaimer, setDisclaimer] = useState('');
  const [error, setError] = useState('');

  // Estados de Autenticação para desenvolvedor
  const [authenticated, setAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const auth = await isAuthenticated();
        setAuthenticated(auth);
      } catch (err) {
        console.error('Erro ao verificar autenticação de dev:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuthStatus();
  }, []);

  const handleDevLogin = async () => {
    const cpfDigits = cpf.replace(/\D/g, '');
    const trimmedPassword = password.trim();

    if (!cpfDigits || !trimmedPassword) {
      showAlert('Campos Vazios', 'Por favor, preencha CPF e Senha.');
      return;
    }

    if (cpfDigits.length !== 11) {
      showAlert('CPF Inválido', 'O CPF deve conter 11 dígitos.');
      return;
    }

    setIsLoggingIn(true);
    setError('');

    try {
      console.log('🔐 Realizando login de admin...');
      await login(cpfDigits, trimmedPassword, true);
      console.log('🔑 Login realizado com sucesso!');
      setAuthenticated(true);
      showAlert('Sucesso', 'Autenticado com sucesso no fluxo de admin!');
    } catch (err: any) {
      console.error('[DEV LOGIN ERROR]', err);
      const backendError = err?.response?.data?.error || err?.response?.data?.message;
      const message = backendError || err.message || 'Erro ao fazer login.';
      setError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAnalyze = async () => {
    if (!query.trim()) {
      showAlert('Campo Vazio', 'Por favor, digite alguma dúvida clínica ou resultado de exame para analisar.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysis('');
    setDisclaimer('');

    try {
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
      if (!apiBaseUrl) {
        throw new Error('EXPO_PUBLIC_API_BASE_URL não está configurada.');
      }

      console.log('🔮 Enviando consulta para IA...');
      const response = await authenticatedRequest(`${apiBaseUrl}/api/ai/analyze`, {
        method: 'POST',
        data: {
          query: query.trim(),
        },
      });

      console.log('🤖 Resposta da IA recebida com sucesso!');
      if (response && response.analysis) {
        setAnalysis(response.analysis);
        setDisclaimer(response.disclaimer || '');
      } else {
        throw new Error('Formato de resposta inesperado do servidor.');
      }
    } catch (err: any) {
      console.error('[AI TEST ERROR]', err);
      const backendError = err?.response?.data?.error || err?.response?.data?.message;
      const message = backendError || err.message || 'Erro desconhecido ao conectar com a IA.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <ThemedView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Voltar */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft color={theme.text} size={20} />
              <ThemedText style={styles.backText}>Voltar</ThemedText>
            </TouchableOpacity>

            {!authenticated ? (
              // TELA DE LOGIN INLINE DO ADMIN
              <View style={styles.loginFormContainer}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={[styles.aiBadge, { backgroundColor: theme.tint }]}>
                    <Lock color="#ffffff" size={16} />
                    <Text style={styles.aiBadgeText}>ACESSO AUTENTICADO</Text>
                  </View>
                  <ThemedText type="subtitle" style={styles.title}>
                    Login de Desenvolvedor
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                    Esta rota exige autenticação válida de paciente. Entre com sua conta para continuar neste fluxo.
                  </ThemedText>
                </View>

                {/* Form */}
                <View style={styles.formCard}>
                  {/* CPF */}
                  <ThemedText style={styles.label}>CPF</ThemedText>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <User color={theme.textSecondary} size={20} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.loginInput, { color: theme.text }]}
                      placeholder="000.000.000-00"
                      placeholderTextColor="rgba(148,163,184,0.6)"
                      value={cpf}
                      onChangeText={(text) => setCpf(formatCPF(text))}
                      keyboardType="numeric"
                      maxLength={14}
                      editable={!isLoggingIn}
                    />
                  </View>

                  {/* Senha */}
                  <ThemedText style={styles.label}>Senha</ThemedText>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <Lock color={theme.textSecondary} size={20} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.loginInput, { color: theme.text }]}
                      placeholder="Sua senha"
                      placeholderTextColor="rgba(148,163,184,0.6)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      editable={!isLoggingIn}
                    />
                  </View>

                  {/* Botão de Entrar */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: theme.tint },
                      isLoggingIn && styles.submitButtonDisabled,
                    ]}
                    onPress={handleDevLogin}
                    disabled={isLoggingIn}
                    activeOpacity={0.8}
                  >
                    {isLoggingIn ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <LogIn color="#ffffff" size={18} style={styles.buttonIcon} />
                        <Text style={styles.submitButtonText}>Entrar no Fluxo Admin</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Error Card */}
                {error !== '' && (
                  <View style={styles.errorCard}>
                    <AlertTriangle color="#ef4444" size={20} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </View>
            ) : (
              // TELA ORIGINAL DE CONSULTAR IA
              <View style={styles.aiAnalyzerContainer}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={[styles.aiBadge, { backgroundColor: theme.tint }]}>
                    <Brain color="#ffffff" size={16} />
                    <Text style={styles.aiBadgeText}>IA MEDICAL</Text>
                  </View>
                  <ThemedText type="subtitle" style={styles.title}>
                    Segunda Opinião por IA
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                    Digite sintomas ou resultados de exames para receber uma análise informativa preliminar.
                  </ThemedText>
                </View>

                {/* Form */}
                <View style={styles.formCard}>
                  <ThemedText style={styles.label}>O que você deseja analisar?</ThemedText>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="Ex: Hemograma completo com plaquetas em 130.000. O que significa? Ou sinto dores de cabeça persistentes há 3 dias..."
                    placeholderTextColor="rgba(148,163,184,0.6)"
                    multiline
                    numberOfLines={6}
                    value={query}
                    onChangeText={setQuery}
                    editable={!isLoading}
                    textAlignVertical="top"
                  />

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: theme.tint },
                      isLoading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleAnalyze}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Sparkles color="#ffffff" size={18} style={styles.buttonIcon} />
                        <Text style={styles.submitButtonText}>Consultar IA</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Error Message */}
                {error !== '' && (
                  <View style={styles.errorCard}>
                    <AlertTriangle color="#ef4444" size={20} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Results */}
                {analysis !== '' && (
                  <View style={styles.resultsContainer}>
                    {/* Analysis */}
                    <View style={[styles.resultCard, { borderColor: theme.border }]}>
                      <View style={styles.resultHeader}>
                        <Brain color={theme.tint} size={20} />
                        <ThemedText style={styles.resultTitle}>Análise Médica</ThemedText>
                      </View>
                      <ThemedText style={styles.analysisText}>{analysis}</ThemedText>
                    </View>

                    {/* Disclaimer */}
                    {disclaimer !== '' && (
                      <View style={styles.disclaimerCard}>
                        <AlertTriangle color="#d97706" size={20} style={styles.disclaimerIcon} />
                        <Text style={styles.disclaimerText}>{disclaimer}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.four,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginFormContainer: {
    gap: 16,
  },
  aiAnalyzerContainer: {
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 4,
  },
  aiBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    gap: 12,
    marginTop: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  loginInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    minHeight: 120,
    fontSize: 15,
    lineHeight: 22,
  },
  submitButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    gap: 16,
    marginTop: 8,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  analysisText: {
    fontSize: 15,
    lineHeight: 24,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderColor: 'rgba(217, 119, 6, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  disclaimerIcon: {
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    color: '#d97706',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
});
