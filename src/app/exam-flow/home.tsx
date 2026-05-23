import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Upload } from 'lucide-react-native';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { useCustomAlert } from '@/context/AlertContext';

// Assumindo que essas importações existem no seu projeto mobile
import { mockExams } from '@/data/mockData';
import { ExamCard } from '@/components/ExamCard';

type FilterType = 'all' | 'completed' | 'pending' | 'processing';

export default function Home() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { showAlert } = useCustomAlert();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const insets = useSafeAreaInsets(); // Pega as margens de segurança reais do aparelho

  // Lógica de filtro (mantida igual, pois o JS roda igual no RN)
  const filteredExams = mockExams
    .filter((exam) => {
      const matchesSearch = 
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || exam.status === selectedFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const statusCounts = {
    all: mockExams.length,
    completed: mockExams.filter((e) => e.status === 'completed').length,
    pending: mockExams.filter((e) => e.status === 'pending').length,
    processing: mockExams.filter((e) => e.status === 'processing').length,
  };

  const handleUpload = () => {
    // Alertas nativos do OS
    showAlert('Em breve!', 'Funcionalidade de upload de exames em breve!');
  };

  // --- COMPONENTES DA LISTA ---

  // O Header da Lista (Busca e Filtros)
  const renderHeader = () => (
    <View style={styles.headerContainer}>
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
          { paddingTop: Math.max(insets.top, 16), paddingBottom: insets.bottom + 100 }
        ]}
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
});