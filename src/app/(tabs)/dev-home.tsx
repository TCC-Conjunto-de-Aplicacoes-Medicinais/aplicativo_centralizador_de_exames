import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlaskConical, Shield, Brain } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function DevHomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.devBadge, { backgroundColor: theme.tint }]}>
              <FlaskConical color="#ffffff" size={16} />
              <Text style={styles.devBadgeText}>DEV</Text>
            </View>
            <ThemedText type="subtitle" style={styles.title}>
              Área de Desenvolvimento
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Ferramentas e testes internos
            </ThemedText>
          </View>

          {/* Ações */}
          <View style={styles.actionsGrid}>
            {/* Testar Segurança */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              onPress={() => router.push('/test-security')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: theme.tint + '18' }]}>
                <Shield color={theme.tint} size={24} />
              </View>
              <ThemedText style={styles.actionTitle}>Testar Segurança</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                Fluxo de autenticação e request assinado
              </ThemedText>
            </TouchableOpacity>

            {/* Fluxo de Exames */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              onPress={() => router.push('/exam-flow/home')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: theme.tint + '18' }]}>
                <FlaskConical color={theme.tint} size={24} />
              </View>
              <ThemedText style={styles.actionTitle}>Fluxo de Exames</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                Abrir tela principal de exames
              </ThemedText>
            </TouchableOpacity>

            {/* Testar IA */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              onPress={() => router.push('/test-ai' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: theme.tint + '18' }]}>
                <Brain color={theme.tint} size={24} />
              </View>
              <ThemedText style={styles.actionTitle}>Testar IA</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                Fluxo de análise de exames e sintomas com Gemini
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.five,
  },

  // --- Header ---
  header: {
    alignItems: 'center',
    gap: 8,
  },
  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 4,
  },
  devBadgeText: {
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
  },

  // --- Actions Grid ---
  actionsGrid: {
    gap: Spacing.three,
  },
  actionCard: {
    borderRadius: 16,
    padding: 20,
    gap: 10,
    borderWidth: 1,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
});
