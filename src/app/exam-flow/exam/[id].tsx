import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
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
  Eye,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react-native';

import { mockExams } from '@/data/mockData';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { useCustomAlert } from '@/context/AlertContext';
import { authenticatedRequest } from '@/services/auth';
import { authenticateUser } from '@/security/signer';


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

const getStatusConfig = (isDark: boolean) => ({
  completed: {
    bg: isDark ? '#064e3b' : '#d1fae5',
    text: isDark ? '#6ee7b7' : '#047857',
    border: isDark ? '#065f46' : '#a7f3d0',
    label: 'Concluído',
  },
  pending: {
    bg: isDark ? '#78350f' : '#fef3c7',
    text: isDark ? '#fcd34d' : '#b45309',
    border: isDark ? '#92400e' : '#fde68a',
    label: 'Pendente',
  },
  processing: {
    bg: isDark ? '#1e3a8a' : '#dbeafe',
    text: isDark ? '#93c5fd' : '#1d4ed8',
    border: isDark ? '#1e40af' : '#bfdbfe',
    label: 'Processando',
  },
});

export default function ExamDetails() {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const { showAlert } = useCustomAlert();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  const [selectedDoctor, setSelectedDoctor] = React.useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState<boolean>(false);

  const exam = mockExams.find((e) => e.id === id);

  const handleShareWithDoctor = async (doctorName: string) => {
    if (!exam || !doctorName) return;

    // Confirmação biométrica / senha local do celular
    const authenticated = await authenticateUser(
      `Confirme com sua biometria ou senha para compartilhar o exame com ${doctorName}.`
    );
    if (!authenticated) {
      return;
    }

    try {
      const shareUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users/exams/share`;
      await authenticatedRequest(shareUrl, {
        method: 'POST',
        data: {
          exam_id: exam.id,
          doctor_name: doctorName,
        },
      });
      showAlert('Sucesso', `Exame compartilhado com ${doctorName} com sucesso!`);
      setSelectedDoctor('');
    } catch (err: any) {
      console.log('[SHARE] Erro ao compartilhar exame:', err?.message);
      showAlert('Erro', 'Não foi possível compartilhar o exame. Tente novamente.');
    }
  };


  if (!exam) {
    return (
      <View style={styles.notFoundContainer}>
        <FileText color={theme.textSecondary} size={48} style={styles.notFoundIcon} />
        <Text style={styles.notFoundText}>Exame não encontrado</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/exam-flow/home')}>
          <Text style={styles.primaryButtonText}>Voltar para o início</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Icon = examTypeIcons[exam.type] || FileText;
  const statusConfig = getStatusConfig(isDarkMode);
  const currentStatus = statusConfig[exam.status as keyof typeof statusConfig];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Cores dos icon circles adaptadas ao tema
  const iconCircleColors = {
    calendar: { bg: isDarkMode ? 'rgba(13,148,136,0.15)' : '#ccfbf1', icon: isDarkMode ? '#2dd4bf' : '#0d9488' },
    fileCheck: { bg: isDarkMode ? 'rgba(37,99,235,0.15)' : '#dbeafe', icon: isDarkMode ? '#60a5fa' : '#2563eb' },
    building: { bg: isDarkMode ? 'rgba(147,51,234,0.15)' : '#f3e8ff', icon: isDarkMode ? '#c084fc' : '#9333ea' },
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Card com Gradiente */}
      <LinearGradient colors={theme.headerBackground} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <View style={styles.iconWrapper}>
            <Icon color="#ffffff" size={isSmallScreen ? 24 : 32} />
          </View>
          <View style={styles.headerTextWrapper}>
            <Text style={[styles.examTitle, isSmallScreen && { fontSize: 20 }]}>{exam.name}</Text>
            <View style={[styles.badge, { backgroundColor: currentStatus.bg, borderColor: currentStatus.border }]}>
              <Text style={[styles.badgeText, { color: currentStatus.text }]}>{currentStatus.label}</Text>
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
              <View style={[styles.infoIconCircle, { backgroundColor: iconCircleColors.calendar.bg }]}>
                <Calendar color={iconCircleColors.calendar.icon} size={20} />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Data</Text>
                <Text style={styles.infoValue}>{formatDate(exam.date)}</Text>
              </View>
            </View>

            {/* Tipo */}
            <View style={styles.gridItem}>
              <View style={[styles.infoIconCircle, { backgroundColor: iconCircleColors.fileCheck.bg }]}>
                <FileCheck color={iconCircleColors.fileCheck.icon} size={20} />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Tipo</Text>
                <Text style={styles.infoValue}>{examTypeLabels[exam.type]}</Text>
              </View>
            </View>
          </View>

          {/* Instituição */}
          {exam.facility && (
            <View style={styles.facilityRow}>
              <View style={[styles.infoIconCircle, { backgroundColor: iconCircleColors.building.bg }]}>
                <Building2 color={iconCircleColors.building.icon} size={20} />
              </View>
              <View style={styles.infoTextWrapper}>
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
          <View style={[styles.card, { backgroundColor: statusConfig.completed.bg, borderColor: statusConfig.completed.border }]}>
            <View style={styles.cardTitleRow}>
              <FileCheck color={statusConfig.completed.text} size={20} style={styles.cardTitleIcon} />
              <Text style={[styles.cardTitle, { color: statusConfig.completed.text, marginBottom: 0 }]}>Resultados</Text>
            </View>
            <Text style={[styles.cardText, { color: statusConfig.completed.text }]}>{exam.results}</Text>
          </View>
        )}

        {/* Estado Pendente */}
        {exam.status === 'pending' && (
          <View style={[styles.card, { backgroundColor: statusConfig.pending.bg, borderColor: statusConfig.pending.border }]}>
            <Text style={[styles.cardTitle, { color: statusConfig.pending.text }]}>Atualização de Status</Text>
            <Text style={[styles.cardText, { color: statusConfig.pending.text, opacity: 0.85 }]}>
              Este exame está agendado e aguardando conclusão. Você será notificado quando os resultados estiverem disponíveis.
            </Text>
          </View>
        )}

        {/* Estado Processando */}
        {exam.status === 'processing' && (
          <View style={[styles.card, { backgroundColor: statusConfig.processing.bg, borderColor: statusConfig.processing.border }]}>
            <Text style={[styles.cardTitle, { color: statusConfig.processing.text }]}>Processando</Text>
            <Text style={[styles.cardText, { color: statusConfig.processing.text, opacity: 0.85 }]}>
              Os resultados do seu exame estão sendo processados pela nossa equipe médica. Estarão disponíveis em breve.
            </Text>
          </View>
        )}

        {/* Compartilhar com Médico (Dropdown e Confirmação) */}
        {exam.status === 'completed' && (
          <View style={styles.shareSection}>
            <Text style={styles.shareSectionTitle}>Compartilhar Exame</Text>
            
            {/* Dropdown Trigger */}
            <TouchableOpacity 
              style={styles.dropdownTrigger} 
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownTriggerLeft}>
                <Share2 color={theme.primary} size={18} style={styles.dropdownIcon} />
                <Text style={[
                  styles.dropdownTriggerText,
                  !selectedDoctor && { color: theme.textSecondary }
                ]}>
                  {selectedDoctor || 'Selecione um médico...'}
                </Text>
              </View>
              {isDropdownOpen ? (
                <ChevronUp color={theme.textSecondary} size={18} />
              ) : (
                <ChevronDown color={theme.textSecondary} size={18} />
              )}
            </TouchableOpacity>

            {/* Dropdown Options List */}
            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity 
                  style={styles.dropdownItem} 
                  onPress={() => {
                    setSelectedDoctor('Dr. Lucas Martins');
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>Dr. Lucas Martins</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dropdownItem, { borderBottomWidth: 0 }]} 
                  onPress={() => {
                    setSelectedDoctor('Dra. Carolina Silva');
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>Dra. Carolina Silva</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Confirm button */}
            <TouchableOpacity 
              style={[
                styles.primaryButton, 
                styles.confirmButtonSpacing,
                !selectedDoctor && { opacity: 0.6 }
              ]}
              disabled={!selectedDoctor}
              onPress={() => handleShareWithDoctor(selectedDoctor)}
            >
              <ShieldCheck color="#ffffff" size={18} style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Confirmar Compartilhamento</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Outras Ações */}
        {exam.status === 'completed' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.outlineButton}
              onPress={() => showAlert('Em breve', 'Funcionalidade de visualização em breve!')}
            >
              <Eye color={theme.text} size={18} style={styles.buttonIcon} />
              <Text style={styles.outlineButtonText}>Visualizar Resultados</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.outlineButton}
              onPress={() => showAlert('Em breve', 'Funcionalidade de download em breve!')}
            >
              <Download color={theme.text} size={18} style={styles.buttonIcon} />
              <Text style={styles.outlineButtonText}>Baixar Resultados</Text>
            </TouchableOpacity>
          </View>
        )}


        {/* Safety Notice */}
        <View style={[styles.card, styles.safetyCard]}>
          <View style={styles.safetyRow}>
            <View style={styles.safetyIconCircle}>
              <FileText color={theme.textSecondary} size={16} />
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
const getStyles = (theme: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.background,
  },
  notFoundIcon: {
    marginBottom: 16,
  },
  notFoundText: {
    fontSize: 18,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 48,
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
    color: theme.headerText,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    marginTop: -24,
    gap: 16,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  gridRow: {
    flexDirection: 'column',
    gap: 16,
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
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
    color: theme.text,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
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
    borderColor: theme.border,
  },
  outlineButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  shareSection: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
  },
  shareSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownIcon: {
    marginRight: 8,
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: theme.text,
  },
  dropdownMenu: {
    backgroundColor: theme.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: theme.text,
  },
  confirmButtonSpacing: {
    marginTop: 12,
  },
  safetyCard: {
    backgroundColor: isDark ? theme.card : '#f8fafc',
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
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyTextWrapper: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  safetyDesc: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18,
  },
});