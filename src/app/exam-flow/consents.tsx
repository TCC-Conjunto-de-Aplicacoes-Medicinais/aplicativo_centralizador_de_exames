import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Building2,
  UserCheck,
  KeyRound,
  Plus,
  X,
  Lock,
  FileCheck2,
  AlertCircle,
} from 'lucide-react-native';

import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { useCustomAlert } from '@/context/AlertContext';
import {
  getConsents,
  authorizeConsent,
  revokeConsent,
  createDirectConsent,
  ConsentItem,
  ConsentStatus,
} from '@/services/consents';

export default function ConsentsScreen() {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const { showAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();

  const [consents, setConsents] = useState<ConsentItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<ConsentStatus>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(true);

  // Modal para conceder novo acesso proativo
  const [modalVisible, setModalVisible] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newScope, setNewScope] = useState('Histórico completo dos últimos 6 meses');
  const [validityDays, setValidityDays] = useState(30);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const loadConsents = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getConsents();
      setConsents(data);
    } catch (err) {
      console.error('Erro ao carregar consentimentos:', err);
      showAlert('Erro', 'Não foi possível carregar a lista de consentimentos.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    loadConsents();
  }, [loadConsents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConsents(false);
    setRefreshing(false);
  }, [loadConsents]);

  const handleAuthorize = async (item: ConsentItem) => {
    setProcessingId(item.id);
    try {
      await authorizeConsent(item.id);
      showAlert(
        'Acesso Concedido ✓',
        `Acesso liberado com sucesso para ${item.requesterName}. Requisição assinada via DPoP com chave do chip de hardware.`
      );
      await loadConsents(false);
      setSelectedTab('active');
    } catch (err: any) {
      if (!err.message?.includes('cancelada')) {
        showAlert('Falha na Autorização', err?.message || 'Não foi possível autorizar o acesso.');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevoke = async (item: ConsentItem) => {
    setProcessingId(item.id);
    try {
      await revokeConsent(item.id);
      showAlert(
        'Acesso Revogado ✓',
        `O acesso de ${item.requesterName} aos seus exames clínicos foi imediatamente revogado.`
      );
      await loadConsents(false);
    } catch (err: any) {
      if (!err.message?.includes('cancelada')) {
        showAlert('Erro', err?.message || 'Não foi possível revogar o consentimento.');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateNewConsent = async () => {
    if (!newDoctorName.trim()) {
      showAlert('Atenção', 'Informe o nome do médico ou instituição de saúde.');
      return;
    }

    setIsSubmittingNew(true);
    try {
      await createDirectConsent(
        newDoctorName.trim(),
        newInstitution.trim(),
        newScope.trim(),
        validityDays
      );
      setModalVisible(false);
      setNewDoctorName('');
      setNewInstitution('');
      setNewScope('Histórico completo dos últimos 6 meses');
      showAlert('Acesso Criado ✓', 'Nova autorização de acesso concedida e assinada com sucesso!');
      await loadConsents(false);
      setSelectedTab('active');
    } catch (err: any) {
      if (!err.message?.includes('cancelada')) {
        showAlert('Erro ao Criar', err?.message || 'Falha ao conceder acesso.');
      }
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const pendingCount = consents.filter((c) => c.status === 'pending').length;
  const activeCount = consents.filter((c) => c.status === 'active').length;
  const revokedCount = consents.filter((c) => c.status === 'revoked').length;

  const filteredConsents = consents.filter((c) => c.status === selectedTab);

  if (isLoading && consents.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >

        {/* Resumo / Métricas Rápidas */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, selectedTab === 'active' && styles.statCardActive]}
            onPress={() => setSelectedTab('active')}
            activeOpacity={0.8}
          >
            <ShieldCheck color={selectedTab === 'active' ? '#059669' : theme.textSecondary} size={20} />
            <Text style={styles.statCount}>{activeCount}</Text>
            <Text style={styles.statLabel}>Ativos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, selectedTab === 'pending' && styles.statCardActive]}
            onPress={() => setSelectedTab('pending')}
            activeOpacity={0.8}
          >
            <Clock color={selectedTab === 'pending' ? '#d97706' : theme.textSecondary} size={20} />
            <Text style={styles.statCount}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, selectedTab === 'revoked' && styles.statCardActive]}
            onPress={() => setSelectedTab('revoked')}
            activeOpacity={0.8}
          >
            <ShieldAlert color={selectedTab === 'revoked' ? '#dc2626' : theme.textSecondary} size={20} />
            <Text style={styles.statCount}>{revokedCount}</Text>
            <Text style={styles.statLabel}>Revogados</Text>
          </TouchableOpacity>
        </View>

        {/* Abas de Navegação */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'active' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('active')}
          >
            <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
              Ativos ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'pending' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('pending')}
          >
            <Text style={[styles.tabText, selectedTab === 'pending' && styles.tabTextActive]}>
              Pendentes ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'revoked' && styles.tabButtonActive]}
            onPress={() => setSelectedTab('revoked')}
          >
            <Text style={[styles.tabText, selectedTab === 'revoked' && styles.tabTextActive]}>
              Revogados ({revokedCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Consentimentos Filtrados */}
        {filteredConsents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <UserCheck color={theme.textSecondary} size={48} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>
              {selectedTab === 'pending'
                ? 'Nenhuma solicitação pendente'
                : selectedTab === 'active'
                ? 'Nenhum acesso ativo no momento'
                : 'Nenhum consentimento revogado'}
            </Text>
            <Text style={styles.emptyDesc}>
              {selectedTab === 'pending'
                ? 'Quando uma clínica ou médico solicitar acesso aos seus exames, o pedido aparecerá aqui para sua aprovação biométrica.'
                : 'Você pode conceder uma nova permissão a qualquer médico utilizando o botão abaixo.'}
            </Text>
          </View>
        ) : (
          filteredConsents.map((item) => {
            const isProcessing = processingId === item.id;
            return (
              <View key={item.id} style={styles.consentCard}>
                {/* Cabeçalho do Card */}
                <View style={styles.cardHeader}>
                  <View style={styles.requesterInfo}>
                    <Text style={styles.requesterName}>{item.requesterName}</Text>
                    <Text style={styles.requesterRole}>{item.requesterRole}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'pending'
                        ? styles.badgePending
                        : item.status === 'active'
                        ? styles.badgeActive
                        : styles.badgeRevoked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.status === 'pending'
                          ? styles.badgeTextPending
                          : item.status === 'active'
                          ? styles.badgeTextActive
                          : styles.badgeTextRevoked,
                      ]}
                    >
                      {item.status === 'pending'
                        ? 'Aguardando'
                        : item.status === 'active'
                        ? 'Autorizado'
                        : 'Revogado'}
                    </Text>
                  </View>
                </View>

                {/* Instituição */}
                <View style={styles.metaRow}>
                  <Building2 color={theme.textSecondary} size={16} />
                  <Text style={styles.metaText}>{item.institution}</Text>
                </View>

                {/* Motivo */}
                {item.reason ? (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>Finalidade Clínica:</Text>
                    <Text style={styles.reasonText}>{item.reason}</Text>
                  </View>
                ) : null}

                {/* Escopo de Dados Liberados */}
                <View style={styles.scopeBox}>
                  <FileCheck2 color={theme.primary} size={18} style={styles.scopeIcon} />
                  <View style={styles.scopeTextWrapper}>
                    <Text style={styles.scopeLabel}>Escopo Autorizado:</Text>
                    <Text style={styles.scopeValue}>{item.scope}</Text>
                  </View>
                </View>

                {/* Datas e Validade */}
                <View style={styles.datesRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>Solicitado em</Text>
                    <Text style={styles.dateValue}>{item.requestDate}</Text>
                  </View>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>Válido até</Text>
                    <Text style={styles.dateValue}>{item.validUntil}</Text>
                  </View>
                </View>

                {/* Selo Criptográfico de Hardware DPoP */}
                {item.dpopSignature ? (
                  <View style={styles.hardwareBadge}>
                    <KeyRound color="#059669" size={14} />
                    <Text style={styles.hardwareBadgeText}>
                      Assinatura DPoP Keystore: {item.dpopSignature}
                    </Text>
                  </View>
                ) : null}

                {/* Ações */}
                <View style={styles.actionsRow}>
                  {item.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, isProcessing && styles.btnDisabled]}
                      onPress={() => handleAuthorize(item)}
                      disabled={isProcessing}
                      activeOpacity={0.8}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <ShieldCheck color="#ffffff" size={18} />
                          <Text style={styles.primaryActionText}>Autorizar com Biometria</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {item.status === 'active' && (
                    <TouchableOpacity
                      style={[styles.revokeActionBtn, isProcessing && styles.btnDisabled]}
                      onPress={() => handleRevoke(item)}
                      disabled={isProcessing}
                      activeOpacity={0.8}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <ShieldAlert color="#ffffff" size={18} />
                          <Text style={styles.revokeActionText}>Revogar Acesso Imediatamente</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {item.status === 'revoked' && (
                    <View style={styles.revokedNotice}>
                      <AlertCircle color="#94a3b8" size={16} />
                      <Text style={styles.revokedNoticeText}>
                        Acesso revogado em {item.revokedAt || item.requestDate}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* Banner Informativo LGPD / DPoP no rodapé com botão fechar */}
        {showPrivacyBanner && (
          <View style={styles.privacyBanner}>
            <View style={styles.bannerIconCircle}>
              <Lock color={theme.primary} size={20} />
            </View>
            <View style={styles.bannerTextWrapper}>
              <Text style={styles.bannerTitle}>Soberania Móvel do Paciente</Text>
              <Text style={styles.bannerDesc}>
                Conforme o Artigo CONIC 2026 e a LGPD, o barramento central não tem autorização
                permanente. Toda leitura exige sua concessão explícita com prova DPoP assinada no
                chip de hardware.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bannerCloseButton}
              onPress={() => setShowPrivacyBanner(false)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityLabel="Fechar aviso de soberania"
            >
              <X color={isDarkMode ? '#a7f3d0' : '#065f46'} size={18} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Botão Flutuante de Novo Acesso Direto */}
      <View style={[styles.floatingFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Plus color="#ffffff" size={20} />
          <Text style={styles.floatingButtonText}>Conceder Novo Acesso a Médico</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Conceder Novo Acesso */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isSubmittingNew && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Acesso Direto</Text>
              {!isSubmittingNew && (
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X color={theme.text} size={24} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Nome do Médico / Especialista *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Dr. Roberto Santos"
                placeholderTextColor="#94a3b8"
                value={newDoctorName}
                onChangeText={setNewDoctorName}
                editable={!isSubmittingNew}
              />

              <Text style={styles.inputLabel}>Clínica ou Hospital (Opcional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Hospital Albert Einstein"
                placeholderTextColor="#94a3b8"
                value={newInstitution}
                onChangeText={setNewInstitution}
                editable={!isSubmittingNew}
              />

              <Text style={styles.inputLabel}>Escopo da Autorização</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Exames dos últimos 6 meses"
                placeholderTextColor="#94a3b8"
                value={newScope}
                onChangeText={setNewScope}
                editable={!isSubmittingNew}
              />

              <Text style={styles.inputLabel}>Prazo de Validade</Text>
              <View style={styles.validityOptions}>
                {[7, 30, 60, 90].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.validityChip,
                      validityDays === days && styles.validityChipSelected,
                    ]}
                    onPress={() => setValidityDays(days)}
                  >
                    <Text
                      style={[
                        styles.validityChipText,
                        validityDays === days && styles.validityChipTextSelected,
                      ]}
                    >
                      {days} dias
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.securityNoticeBox}>
                <Lock color={theme.primary} size={16} />
                <Text style={styles.securityNoticeText}>
                  A concessão exigirá sua biometria e gerará uma assinatura DPoP vinculada ao seu
                  smartphone. Você poderá revogar este acesso a qualquer momento.
                </Text>
              </View>

              <View style={styles.modalActionButtons}>
                {!isSubmittingNew && (
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, isSubmittingNew && styles.btnDisabled]}
                  onPress={handleCreateNewConsent}
                  disabled={isSubmittingNew}
                >
                  {isSubmittingNew ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Confirmar e Assinar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      padding: 16,
      gap: 16,
    },

    // Privacy Banner
    privacyBanner: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#065f46' : '#a7f3d0',
      padding: 14,
      gap: 12,
      alignItems: 'flex-start',
    },
    bannerIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#ccfbf1',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    bannerTextWrapper: {
      flex: 1,
    },
    bannerTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#a7f3d0' : '#065f46',
      marginBottom: 4,
    },
    bannerDesc: {
      fontSize: 12,
      color: isDark ? '#d1fae5' : '#047857',
      lineHeight: 18,
    },
    bannerCloseButton: {
      padding: 4,
      marginTop: -2,
      marginRight: -2,
    },

    // Quick Stats
    statsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      gap: 4,
    },
    statCardActive: {
      borderColor: theme.primary,
      backgroundColor: isDark ? 'rgba(13,148,136,0.15)' : '#f0fdfa',
    },
    statCount: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    statLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: '500',
    },

    // Tabs
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 4,
      gap: 4,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabButtonActive: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    tabTextActive: {
      color: '#ffffff',
    },

    // Consent Card
    consentCard: {
      backgroundColor: theme.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    requesterInfo: {
      flex: 1,
    },
    requesterName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    requesterRole: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
    },
    badgePending: {
      backgroundColor: isDark ? '#78350f' : '#fef3c7',
      borderColor: isDark ? '#92400e' : '#fde68a',
    },
    badgeActive: {
      backgroundColor: isDark ? '#064e3b' : '#d1fae5',
      borderColor: isDark ? '#065f46' : '#a7f3d0',
    },
    badgeRevoked: {
      backgroundColor: isDark ? '#450a0a' : '#fee2e2',
      borderColor: isDark ? '#7f1d1d' : '#fecaca',
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    badgeTextPending: {
      color: isDark ? '#fcd34d' : '#b45309',
    },
    badgeTextActive: {
      color: isDark ? '#6ee7b7' : '#047857',
    },
    badgeTextRevoked: {
      color: isDark ? '#fca5a5' : '#b91c1c',
    },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    metaText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '500',
    },

    reasonBox: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
      padding: 10,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
    },
    reasonLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 2,
    },
    reasonText: {
      fontSize: 13,
      color: theme.text,
      lineHeight: 18,
    },

    scopeBox: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(13,148,136,0.1)' : '#f0fdfa',
      borderRadius: 8,
      padding: 10,
      gap: 10,
      alignItems: 'center',
    },
    scopeIcon: {
      flexShrink: 0,
    },
    scopeTextWrapper: {
      flex: 1,
    },
    scopeLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    scopeValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      marginTop: 2,
    },

    datesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    dateCol: {
      gap: 2,
    },
    dateLabel: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    dateValue: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
    },

    hardwareBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(5,150,105,0.15)' : '#dcfce7',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    hardwareBadgeText: {
      fontSize: 10,
      color: isDark ? '#34d399' : '#065f46',
      fontWeight: '600',
      fontFamily: 'monospace',
    },

    actionsRow: {
      marginTop: 4,
    },
    primaryActionBtn: {
      flexDirection: 'row',
      backgroundColor: '#059669',
      height: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryActionText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
    revokeActionBtn: {
      flexDirection: 'row',
      backgroundColor: '#dc2626',
      height: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    revokeActionText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
    revokedNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 6,
    },
    revokedNoticeText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontStyle: 'italic',
    },
    btnDisabled: {
      opacity: 0.6,
    },

    // Empty State
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
      gap: 12,
    },
    emptyIcon: {
      marginBottom: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    emptyDesc: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },

    // Floating Footer
    floatingFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.card,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingHorizontal: 16,
      paddingTop: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    floatingButton: {
      flexDirection: 'row',
      backgroundColor: theme.primary,
      height: 48,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    floatingButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      padding: 20,
      gap: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 14,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    modalForm: {
      gap: 14,
      paddingBottom: 24,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      marginTop: 6,
    },
    modalInput: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      height: 46,
      fontSize: 14,
      color: theme.text,
    },
    validityOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    validityChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      alignItems: 'center',
    },
    validityChipSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    validityChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    validityChipTextSelected: {
      color: '#ffffff',
    },
    securityNoticeBox: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(13,148,136,0.1)' : '#f0fdfa',
      borderRadius: 8,
      padding: 10,
      gap: 10,
      alignItems: 'flex-start',
      marginTop: 4,
    },
    securityNoticeText: {
      flex: 1,
      fontSize: 11,
      color: theme.textSecondary,
      lineHeight: 16,
    },
    modalActionButtons: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    modalCancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    modalSubmitBtn: {
      flex: 2,
      backgroundColor: theme.primary,
      height: 48,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalSubmitText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#ffffff',
    },
  });
