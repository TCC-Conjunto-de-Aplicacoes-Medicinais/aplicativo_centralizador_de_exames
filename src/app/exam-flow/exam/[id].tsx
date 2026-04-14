import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FileText,
  Activity,
  Heart,
  Droplet,
  FileCheck2,
  Calendar,
  Building2,
  FileCheck,
  Share2,
  Download,
} from 'lucide-react-native';

// Assumindo que mockExams existe neste caminho
import { mockExams } from '../../../data/mockData';

const examTypeIcons: Record<string, any> = {
  'blood-test': Droplet,
  imaging: Activity,
  cardiology: Heart,
  'urine-test': Droplet,
  report: FileCheck2,
};

const examTypeLabels: Record<string, string> = {
  'blood-test': 'Exame de Sangue',
  imaging: 'Imagem',
  cardiology: 'Cardiologia',
  'urine-test': 'Exame de Urina',
  report: 'Relatório',
};

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  completed: { bg: '#d1fae5', text: '#047857', border: '#a7f3d0', label: 'Concluído' },
  pending: { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: 'Pendente' },
  processing: { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe', label: 'Processando' },
};

export default function ExamDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const exam = mockExams.find((e) => e.id === id);

  if (!exam) {
    return (
      <View style={styles.notFoundContainer}>
        <FileText color="#94a3b8" size={48} style={styles.notFoundIcon} />
        <Text style={styles.notFoundText}>Exame não encontrado</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/exam-flow/home')}>
          <Text style={styles.primaryButtonText}>Voltar para o início</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Icon = examTypeIcons[exam.type] || FileText;
  const currentStatus = statusConfig[exam.status];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Card com Gradiente */}
      <LinearGradient colors={['#059669', '#0d9488']} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <View style={styles.iconWrapper}>
            <Icon color="#ffffff" size={32} />
          </View>
          <View style={styles.headerTextWrapper}>
            <Text style={styles.examTitle}>{exam.name}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{currentStatus.label}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Conteúdo Principal */}
      <View style={styles.content}>
        
        {/* Quick Info Card */}
        <View style={[styles.card, styles.shadow]}>
          <View style={styles.gridRow}>
            {/* Data */}
            <View style={styles.gridItem}>
              <View style={[styles.infoIconCircle, { backgroundColor: '#ccfbf1' }]}>
                <Calendar color="#0d9488" size={20} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Data</Text>
                <Text style={styles.infoValue}>{formatDate(exam.date)}</Text>
              </View>
            </View>

            {/* Tipo */}
            <View style={styles.gridItem}>
              <View style={[styles.infoIconCircle, { backgroundColor: '#dbeafe' }]}>
                <FileCheck color="#2563eb" size={20} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Tipo</Text>
                <Text style={styles.infoValue}>{examTypeLabels[exam.type]}</Text>
              </View>
            </View>
          </View>

          {/* Instituição */}
          {exam.facility && (
            <View style={styles.facilityRow}>
              <View style={[styles.infoIconCircle, { backgroundColor: '#f3e8ff' }]}>
                <Building2 color="#9333ea" size={20} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Instituição</Text>
                <Text style={styles.infoValue}>{exam.facility}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Descrição */}
        {exam.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Descrição</Text>
            <Text style={styles.cardText}>{exam.description}</Text>
          </View>
        )}

        {/* Resultados (Concluído) */}
        {exam.results && exam.status === 'completed' && (
          <View style={[styles.card, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
            <View style={styles.cardTitleRow}>
              <FileCheck color="#065f46" size={20} style={styles.cardTitleIcon} />
              <Text style={[styles.cardTitle, { color: '#065f46', marginBottom: 0 }]}>Resultados</Text>
            </View>
            <Text style={[styles.cardText, { color: '#064e3b' }]}>{exam.results}</Text>
          </View>
        )}

        {/* Estado Pendente */}
        {exam.status === 'pending' && (
          <View style={[styles.card, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
            <Text style={[styles.cardTitle, { color: '#78350f' }]}>Atualização de Status</Text>
            <Text style={[styles.cardText, { color: '#92400e' }]}>
              Este exame está agendado e aguardando conclusão. Você será notificado quando os resultados estiverem disponíveis.
            </Text>
          </View>
        )}

        {/* Estado Processando */}
        {exam.status === 'processing' && (
          <View style={[styles.card, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Text style={[styles.cardTitle, { color: '#1e3a8a' }]}>Processando</Text>
            <Text style={[styles.cardText, { color: '#1e40af' }]}>
              Os resultados do seu exame estão sendo processados pela nossa equipe médica. Estarão disponíveis em breve.
            </Text>
          </View>
        )}

        {/* Botões de Ação */}
        {exam.status === 'completed' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => Alert.alert('Em breve', 'Funcionalidade de compartilhar em breve!')}
            >
              <Share2 color="#ffffff" size={18} style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Compartilhar com Médico</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.outlineButton}
              onPress={() => Alert.alert('Em breve', 'Funcionalidade de download em breve!')}
            >
              <Download color="#0f172a" size={18} style={styles.buttonIcon} />
              <Text style={styles.outlineButtonText}>Baixar Resultados</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Safety Notice */}
        <View style={[styles.card, { backgroundColor: '#f8fafc', marginBottom: 32 }]}>
          <View style={styles.safetyRow}>
            <View style={styles.safetyIconCircle}>
              <FileText color="#475569" size={16} />
            </View>
            <View style={styles.safetyTextWrapper}>
              <Text style={styles.safetyTitle}>Privacidade Protegida</Text>
              <Text style={styles.safetyDesc}>
                Seus registros médicos são criptografados e seguros. Você controla quem pode acessar seus exames através das aprovações de solicitação de acesso.
              </Text>
            </View>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

// --- ESTILOS NATIVOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundIcon: {
    marginBottom: 16,
  },
  notFoundText: {
    fontSize: 18,
    color: '#475569',
    marginBottom: 24,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 48, // Espaço extra para o card subir por cima
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrapper: {
    flex: 1,
  },
  examTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    marginTop: -24, // Faz o primeiro card "subir" por cima do gradiente
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#0d9488',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  outlineButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  safetyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyTextWrapper: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  safetyDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});