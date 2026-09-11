import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Upload, FileText, ChevronDown, Check, X, Calendar, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { useCustomAlert } from '@/context/AlertContext';
import * as DocumentPicker from 'expo-document-picker';
import { ExamType, ExamTypeLabels, MedicalExam } from '@/types/exam-flow-types';
import { uploadExam, getExams } from '@/services/exams';
import { useFocusEffect, useRouter } from 'expo-router';

// Assumindo que essas importações existem no seu projeto mobile
import { ExamCard } from '@/components/ExamCard';

type FilterType = 'all' | 'completed' | 'pending' | 'processing';

export default function Home() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { showAlert } = useCustomAlert();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const insets = useSafeAreaInsets(); // Pega as margens de segurança reais do aparelho

  const [exams, setExams] = useState<MedicalExam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadExams = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getExams();
      setExams(data);
    } catch (err: any) {
      console.error('Erro ao buscar exames:', err);
      showAlert('Erro', 'Não foi possível carregar os exames.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadExams(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExams(exams.length === 0);
    }, [])
  );

  // Lógica de filtro (mantida igual, pois o JS roda igual no RN)
  const filteredExams = exams
    .filter((exam) => {
      const matchesSearch = 
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || exam.status === selectedFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const statusCounts = {
    all: exams.length,
    completed: exams.filter((e) => e.status === 'completed').length,
    pending: exams.filter((e) => e.status === 'pending').length,
    processing: exams.filter((e) => e.status === 'processing').length,
  };

  // Estados para o Modal de Upload de Exame
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [day, setDay] = useState(new Date().getDate());
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [year, setYear] = useState(new Date().getFullYear());

  const [selectedExamType, setSelectedExamType] = useState<ExamType>(ExamType.BLOOD_TEST);
  const [typeModalVisible, setTypeModalVisible] = useState(false);

  const [institution, setInstitution] = useState('');
  const [examResult, setExamResult] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const monthsList = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getDaysInMonth = (m: number, y: number) => {
    return new Date(y, m, 0).getDate();
  };

  const adjustDay = (amount: number) => {
    const daysInMonth = getDaysInMonth(month, year);
    let newDay = day + amount;
    if (newDay < 1) newDay = daysInMonth;
    if (newDay > daysInMonth) newDay = 1;
    setDay(newDay);
  };

  const adjustMonth = (amount: number) => {
    let newMonth = month + amount;
    if (newMonth < 1) newMonth = 12;
    if (newMonth > 12) newMonth = 1;
    setMonth(newMonth);
    const daysInNewMonth = getDaysInMonth(newMonth, year);
    if (day > daysInNewMonth) {
      setDay(daysInNewMonth);
    }
  };

  const adjustYear = (amount: number) => {
    const newYear = year + amount;
    setYear(newYear);
    const daysInNewMonth = getDaysInMonth(month, newYear);
    if (day > daysInNewMonth) {
      setDay(daysInNewMonth);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile(asset);
      }
    } catch (err) {
      showAlert('Erro', 'Não foi possível selecionar o arquivo.');
    }
  };

  const handleSubmitUpload = async () => {
    if (!selectedFile) {
      showAlert('Atenção', 'Selecione um arquivo de exame em formato PDF.');
      return;
    }

    setIsUploading(true);

    try {
      const formattedMonth = month < 10 ? `0${month}` : `${month}`;
      const formattedDay = day < 10 ? `0${day}` : `${day}`;
      const examDateStr = `${year}-${formattedMonth}-${formattedDay}`;

      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/pdf',
      } as any);

      formData.append('date', examDateStr);
      formData.append('exam_type', selectedExamType);

      if (institution.trim() !== '') {
        formData.append('institution', institution.trim());
      }
      if (examResult.trim() !== '') {
        formData.append('exam_result', examResult.trim());
      }

      await uploadExam(formData);

      setIsUploading(false);
      setUploadModalVisible(false);

      // Limpa os estados do formulário
      setSelectedFile(null);
      setInstitution('');
      setExamResult('');
      setDay(new Date().getDate());
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
      setSelectedExamType(ExamType.BLOOD_TEST);

      showAlert('Sucesso', 'Exame adicionado com sucesso!');
      
      // Atualiza a lista de exames
      loadExams(false);
    } catch (err: any) {
      setIsUploading(false);
      
      console.log('[DEBUG UPLOAD EXAM ERROR DETAILS]');
      if (err?.config) {
        console.log('Request URL:', err.config.url);
        console.log('Request Method:', err.config.method);
        console.log('Request Headers:', JSON.stringify(err.config.headers, null, 2));
      }
      if (err?.response) {
        console.log('Response Status:', err.response.status);
        console.log('Response Headers:', JSON.stringify(err.response.headers, null, 2));
        console.log('Response Data:', JSON.stringify(err.response.data, null, 2));
      } else {
        console.log('Error Message:', err.message);
        console.log('Full Error Object:', JSON.stringify(err, null, 2));
      }

      const backendMsg = err?.response?.data?.error || err?.response?.data?.message;
      const message = backendMsg || err.message || 'Houve um erro ao enviar o exame.';
      showAlert('Erro ao enviar', message);
    }
  };

  const handleUpload = () => {
    setUploadModalVisible(true);
  };

  // --- COMPONENTES DA LISTA ---

  // O Header da Lista (Busca e Filtros)
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Banner de Gestão de Consentimentos (LGPD & DPoP) */}
      <TouchableOpacity
        style={styles.consentsBanner}
        activeOpacity={0.85}
        onPress={() => router.push('/exam-flow/consents')}
      >
        <View style={styles.consentsBannerIcon}>
          <ShieldCheck color="#059669" size={22} />
        </View>
        <View style={styles.consentsBannerContent}>
          <Text style={styles.consentsBannerTitle}>Gestão de Consentimentos</Text>
          <Text style={styles.consentsBannerSubtitle}>
            Autorize ou revogue acessos com criptografia DPoP
          </Text>
        </View>
        <ChevronRight color={theme.textSecondary} size={18} />
      </TouchableOpacity>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search color="#94a3b8" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar exames..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery} // RN usa onChangeText em vez de onChange
          clearButtonMode="while-editing" // Botão 'x' nativo no iOS
        />
      </View>

      {/* Filter Chips - Rola horizontalmente sem quebrar a tela */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[
          { key: 'all', label: 'Todos', count: statusCounts.all, color: '#0d9488' },
          { key: 'completed', label: 'Concluídos', count: statusCounts.completed, color: '#059669' },
          { key: 'pending', label: 'Pendentes', count: statusCounts.pending, color: '#d97706' },
          { key: 'processing', label: 'Processando', count: statusCounts.processing, color: '#2563eb' },
        ]}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.filtersContainer}
        renderItem={({ item }) => {
          const isSelected = selectedFilter === item.key;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedFilter(item.key as FilterType)}
              style={[
                styles.filterChip,
                isSelected ? { backgroundColor: item.color, borderColor: item.color } : styles.filterChipInactive
              ]}
            >
              <Text style={[styles.filterText, isSelected ? styles.filterTextActive : styles.filterTextInactive]}>
                {item.label} ({item.count})
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  // O Estado Vazio (Quando a busca não acha nada)
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Search color="#94a3b8" size={32} />
      </View>
      <Text style={styles.emptyTitle}>Nenhum exame encontrado</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Tente ajustar os termos de busca' : 'Seu histórico de exames aparecerá aqui'}
      </Text>
    </View>
  );

  if (isLoading && exams.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* A FlatList é a dona da tela. Ela cuida do scroll da busca, dos botões e dos cards.
        O contentContainerStyle empurra o final da lista para cima, para não ficar escondido atrás do Footer.
      */}
      <FlatList
        data={filteredExams}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ExamCard exam={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: 12, paddingBottom: insets.bottom + 100 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      />

      {/* Footer com Upload Fixo embaixo */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={handleUpload}
          activeOpacity={0.8}
        >
          <Upload color="#ffffff" size={20} style={styles.uploadIcon} />
          <Text style={styles.uploadButtonText}>Fazer Upload de Novo Exame</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE UPLOAD DE EXAME */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isUploading && setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Novo Exame</Text>
              {!isUploading && (
                <TouchableOpacity onPress={() => setUploadModalVisible(false)} style={styles.closeButton}>
                  <X color={theme.text} size={24} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Seleção do Arquivo */}
              <Text style={styles.label}>Arquivo do Exame (PDF) <Text style={styles.required}>*</Text></Text>
              {selectedFile ? (
                <View style={styles.selectedFileContainer}>
                  <FileText color={theme.primary} size={24} style={styles.fileIcon} />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  {!isUploading && (
                    <TouchableOpacity onPress={() => setSelectedFile(null)} style={styles.removeFileButton}>
                      <X color="#ef4444" size={18} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity style={styles.filePickerButton} onPress={handlePickDocument}>
                  <Upload color={theme.textSecondary} size={20} style={styles.filePickerIcon} />
                  <Text style={styles.filePickerText}>Selecionar PDF do Exame</Text>
                </TouchableOpacity>
              )}

              {/* Tipo de Exame */}
              <Text style={styles.label}>Tipo de Exame <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => !isUploading && setTypeModalVisible(true)}>
                <Text style={styles.dropdownButtonText}>
                  {ExamTypeLabels[selectedExamType]}
                </Text>
                <ChevronDown color={theme.textSecondary} size={20} />
              </TouchableOpacity>

              {/* Data do Exame */}
              <Text style={styles.label}>Data do Exame <Text style={styles.required}>*</Text></Text>
              <View style={styles.dateSelectorContainer}>
                {/* Dia */}
                <View style={styles.dateSelectorCol}>
                  <Text style={styles.dateLabel}>Dia</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => !isUploading && adjustDay(-1)}>
                      <Text style={styles.counterBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterVal}>{day}</Text>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => !isUploading && adjustDay(1)}>
                      <Text style={styles.counterBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Mês */}
                <View style={styles.dateSelectorCol}>
                  <Text style={styles.dateLabel}>Mês</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => !isUploading && adjustMonth(-1)}>
                      <Text style={styles.counterBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValText} numberOfLines={1}>{monthsList[month - 1]}</Text>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => !isUploading && adjustMonth(1)}>
                      <Text style={styles.counterBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Ano */}
                <View style={styles.dateSelectorCol}>
                  <Text style={styles.dateLabel}>Ano</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => !isUploading && adjustYear(-1)}>
                      <Text style={styles.counterBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterVal}>{year}</Text>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => !isUploading && adjustYear(1)}>
                      <Text style={styles.counterBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Instituição (opcional) */}
              <Text style={styles.label}>Instituição (Opcional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Laboratório Fleury, Einstein..."
                placeholderTextColor="#94a3b8"
                value={institution}
                onChangeText={setInstitution}
                editable={!isUploading}
              />

              {/* Resultado do Exame (opcional) */}
              <Text style={styles.label}>Resultado do Exame (Opcional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputMultiline]}
                placeholder="Descreva o resultado ou observações do exame..."
                placeholderTextColor="#94a3b8"
                value={examResult}
                onChangeText={setExamResult}
                multiline
                numberOfLines={3}
                editable={!isUploading}
              />

              {/* Botões do Formulário */}
              <View style={styles.modalActionButtons}>
                {!isUploading && (
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setUploadModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.submitButton, isUploading && styles.submitButtonDisabled]}
                  onPress={handleSubmitUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Salvar Exame</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SUB-MODAL SELECTOR DE TIPO DE EXAME */}
      <Modal
        visible={typeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTypeModalVisible(false)}
      >
        <View style={styles.subModalOverlay}>
          <View style={styles.subModalContent}>
            <View style={styles.subModalHeader}>
              <Text style={styles.subModalTitle}>Selecione o Tipo de Exame</Text>
              <TouchableOpacity onPress={() => setTypeModalVisible(false)}>
                <X color={theme.text} size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.typesList}>
              {Object.values(ExamType).map((type) => {
                const isSelected = selectedExamType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeOptionItem, isSelected && styles.typeOptionItemSelected]}
                    onPress={() => {
                      setSelectedExamType(type);
                      setTypeModalVisible(false);
                    }}
                  >
                    <Text style={[styles.typeOptionText, isSelected && styles.typeOptionTextSelected]}>
                      {ExamTypeLabels[type]}
                    </Text>
                    {isSelected && <Check color={theme.primary} size={18} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- ESTILOS NATIVOS ---
const getStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  headerContainer: {
    marginBottom: 16,
    gap: 12,
  },
  consentsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    gap: 12,
  },
  consentsBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card === '#ffffff' ? '#ecfdf5' : 'rgba(5,150,105,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentsBannerContent: {
    flex: 1,
  },
  consentsBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  consentsBannerSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: theme.text,
    fontSize: 16,
  },
  filtersContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChipInactive: {
    backgroundColor: 'transparent',
    borderColor: theme.border,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  filterTextInactive: {
    color: theme.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10, 
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    marginRight: 8,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    paddingBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
  },
  filePickerIcon: {
    marginRight: 8,
  },
  filePickerText: {
    color: theme.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
  },
  fileIcon: {
    marginRight: 10,
  },
  fileName: {
    flex: 1,
    color: theme.text,
    fontSize: 15,
    fontWeight: '500',
  },
  removeFileButton: {
    padding: 6,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
  },
  dropdownButtonText: {
    color: theme.text,
    fontSize: 15,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateSelectorCol: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    height: 44,
    width: '100%',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  counterBtn: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.border + '22',
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  counterVal: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  counterValText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 2,
  },
  modalInput: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: theme.text,
  },
  modalInputMultiline: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  modalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 30,
  },
  cancelButton: {
    paddingHorizontal: 20,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    paddingHorizontal: 24,
    height: 48,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minWidth: 120,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  subModalContent: {
    backgroundColor: theme.background,
    borderRadius: 12,
    width: '100%',
    maxHeight: '70%',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 12,
    marginBottom: 8,
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  typesList: {
    paddingVertical: 8,
  },
  typeOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border + '22',
  },
  typeOptionItemSelected: {
    backgroundColor: theme.primary + '11',
    borderRadius: 6,
  },
  typeOptionText: {
    fontSize: 15,
    color: theme.text,
  },
  typeOptionTextSelected: {
    color: theme.primary,
    fontWeight: '600',
  },
});