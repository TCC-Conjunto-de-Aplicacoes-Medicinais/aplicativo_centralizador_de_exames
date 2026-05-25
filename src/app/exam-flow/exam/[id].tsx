import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
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
  Trash2,
} from 'lucide-react-native';

import { File as FSFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { useCustomAlert } from '@/context/AlertContext';
import { authenticatedRequest } from '@/services/auth';
import { authenticateUser } from '@/security/signer';
import { getExamByID, downloadExamFileNative, deleteExam } from '@/services/exams';
import { MedicalExam, ExamType, ExamTypeLabels } from '@/types/exam-flow-types';

const examTypeIcons: Record<string, any> = {
  [ExamType.BLOOD_TEST]: Droplet,
  [ExamType.URINE_TEST]: Droplet,
  [ExamType.IMAGING]: Activity,
  [ExamType.CARDIOLOGY]: Heart,
  [ExamType.REPORT]: FileCheck2,
  [ExamType.ULTRASOUND]: Activity,
  [ExamType.XRAY]: Activity,
  [ExamType.MRI]: Activity,
  [ExamType.CT_SCAN]: Activity,
  [ExamType.ECG]: Heart,
  [ExamType.EEG]: Activity,
  [ExamType.ENDOSCOPY]: FileCheck2,
  [ExamType.BIOMARKER]: Droplet,
  [ExamType.OTHER]: FileText,
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
  const [isOpeningPDF, setIsOpeningPDF] = React.useState<boolean>(false);
  const [isDownloadingFile, setIsDownloadingFile] = React.useState<boolean>(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);

  const [exam, setExam] = React.useState<MedicalExam | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let isActive = true;
    const fetchExam = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getExamByID(id);
        if (isActive) {
          setExam(data);
        }
      } catch (err: any) {
        console.error('Erro ao buscar detalhes do exame:', err);
        showAlert('Erro', 'Não foi possível carregar os detalhes do exame.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchExam();

    return () => {
      isActive = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const handleDeleteExam = async () => {
    if (!exam) return;

    const authenticated = await authenticateUser(
      'Confirme com sua biometria ou senha para excluir este exame permanentemente.'
    );
    if (!authenticated) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteExam(exam.id);
      showAlert('Sucesso', 'Exame excluído com sucesso!');
      router.replace('/exam-flow/home');
    } catch (err: any) {
      console.log('[DELETE] Erro ao excluir exame:', err?.message);
      showAlert('Erro', 'Não foi possível excluir o exame. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

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
      const shareUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/exams/share`;
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

  /** Baixa o arquivo e abre o visualizador/compartilhador do sistema */
  const handleOpenPDF = async () => {
    if (!exam?.fileUrl) {
      showAlert('Arquivo indisponível', 'Este exame não possui um arquivo associado.');
      return;
    }

    setIsOpeningPDF(true);
    try {
      console.log('[OPEN_PDF] Baixando arquivo para cache:', exam.fileUrl);
      const safeFilename = (exam.filename || `exame_${exam.id}`).replace(/[^a-zA-Z0-9._-]/g, '_');

      const cacheFile = new FSFile(Paths.cache, safeFilename);
      if (cacheFile.exists) cacheFile.delete();

      // Baixa o arquivo de forma nativa e autenticada
      await downloadExamFileNative(exam.fileUrl, cacheFile);

      console.log('[OPEN_PDF] Arquivo salvo em cache. URI:', cacheFile.uri);

      // Verifica se o compartilhamento está disponível no dispositivo
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        // Abre o visualizador/compartilhador do sistema que permite visualizar o PDF
        await Sharing.shareAsync(cacheFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Abrir PDF',
        });
      } else {
        // Fallback usando o Linking comum
        const openUri = cacheFile.contentUri || cacheFile.uri;
        await Linking.openURL(openUri);
      }
    } catch (err: any) {
      console.error('[OPEN_PDF ERROR]', err);
      showAlert('Erro ao abrir PDF', err?.message || 'Não foi possível abrir o visualizador.');
    } finally {
      setIsOpeningPDF(false);
    }
  };



  /** Baixa o arquivo e salva no armazenamento de documentos */
  const handleDownloadFile = async () => {
    if (!exam?.fileUrl) {
      showAlert('Arquivo indisponível', 'Este exame não possui um arquivo associado.');
      return;
    }

    setIsDownloadingFile(true);
    try {
      console.log('[DOWNLOAD] Baixando arquivo:', exam.fileUrl);
      const safeFilename = (exam.filename || `exame_${exam.id}`).replace(/[^a-zA-Z0-9._-]/g, '_');

      // Baixa o arquivo para a pasta de cache temporária primeiro
      const tempCacheFile = new FSFile(Paths.cache, `download_${safeFilename}`);
      if (tempCacheFile.exists) tempCacheFile.delete();
      await downloadExamFileNative(exam.fileUrl, tempCacheFile);

      if (Platform.OS === 'android') {
        // Fluxo para Android: Salvar na pasta Downloads do sistema usando o SAF (Storage Access Framework)
        let directoryUri = await AsyncStorage.getItem('user_download_directory_uri');

        if (!directoryUri) {
          // Solicita permissão para uma pasta externa
          const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (!permissions.granted) {
            showAlert('Permissão necessária', 'Para baixar o arquivo, você precisa conceder permissão para salvar na pasta Downloads.');
            setIsDownloadingFile(false);
            return;
          }
          directoryUri = permissions.directoryUri;
          await AsyncStorage.setItem('user_download_directory_uri', directoryUri);
        }

        // Lê o arquivo do cache temporário como base64
        const base64Data = await tempCacheFile.base64();

        // O SAF createFileAsync precisa do nome sem extensão
        const extIndex = safeFilename.lastIndexOf('.');
        const filenameWithoutExt = extIndex !== -1 ? safeFilename.substring(0, extIndex) : safeFilename;

        // Cria o arquivo no diretório permitido
        const fileUri = await StorageAccessFramework.createFileAsync(
          directoryUri,
          filenameWithoutExt,
          'application/pdf'
        );

        // Escreve os dados em base64 no arquivo criado
        await StorageAccessFramework.writeAsStringAsync(fileUri, base64Data, {
          encoding: 'base64',
        });

        // Limpa o cache temporário
        if (tempCacheFile.exists) tempCacheFile.delete();

        console.log('[DOWNLOAD] Arquivo salvo no SAF:', fileUri);
        showAlert(
          'Download Concluído ✓',
          `O arquivo "${safeFilename}" foi salvo com sucesso na pasta de downloads.`
        );
      } else {
        // Fluxo para iOS/Outros: Usa a folha de compartilhamento/salvamento do sistema
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(tempCacheFile.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Salvar Resultados',
          });
          showAlert('Download', 'Selecione "Salvar em Arquivos" para salvar o exame.');
        } else {
          // Fallback para Paths.document
          const docFile = new FSFile(Paths.document, safeFilename);
          if (docFile.exists) docFile.delete();
          tempCacheFile.copy(docFile);
          if (tempCacheFile.exists) tempCacheFile.delete();
          showAlert(
            'Download Concluído ✓',
            `O arquivo "${safeFilename}" foi salvo no armazenamento interno do app.`
          );
        }
      }
    } catch (err: any) {
      console.error('[DOWNLOAD ERROR]', err);
      showAlert('Erro ao baixar', err?.message || 'Não foi possível baixar o arquivo.');
    } finally {
      setIsDownloadingFile(false);
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
                <Text style={styles.infoValue}>{ExamTypeLabels[exam.type]}</Text>
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
              style={[
                styles.greenButton,
                !exam.fileUrl && styles.buttonDisabled,
              ]}
              onPress={handleOpenPDF}
              disabled={isOpeningPDF || !exam.fileUrl}
              activeOpacity={0.8}
            >
              {isOpeningPDF ? (
                <ActivityIndicator color="#ffffff" size="small" style={styles.buttonIcon} />
              ) : (
                <Eye color="#ffffff" size={18} style={styles.buttonIcon} />
              )}
              <Text style={styles.greenButtonText}>
                {isOpeningPDF ? 'Abrindo...' : 'Abrir PDF'}
              </Text>
            </TouchableOpacity>



            <TouchableOpacity
              style={[
                styles.outlineButton,
                !exam.fileUrl && styles.buttonDisabled,
              ]}
              onPress={handleDownloadFile}
              disabled={isDownloadingFile || !exam.fileUrl}
              activeOpacity={0.8}
            >
              {isDownloadingFile ? (
                <ActivityIndicator color={theme.text} size="small" style={styles.buttonIcon} />
              ) : (
                <Download color={!exam.fileUrl ? theme.textSecondary : theme.text} size={18} style={styles.buttonIcon} />
              )}
              <Text style={[styles.outlineButtonText, !exam.fileUrl && { color: theme.textSecondary }]}>
                {isDownloadingFile ? 'Baixando...' : 'Baixar Resultados'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.redButton}
              onPress={handleDeleteExam}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              {isDeleting ? (
                <ActivityIndicator color="#ffffff" size="small" style={styles.buttonIcon} />
              ) : (
                <Trash2 color="#ffffff" size={18} style={styles.buttonIcon} />
              )}
              <Text style={styles.redButtonText}>
                {isDeleting ? 'Excluindo...' : 'Excluir Exame'}
              </Text>
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
  greenButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  redButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonDisabled: {
    opacity: 0.45,
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