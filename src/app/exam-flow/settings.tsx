import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { useCustomAlert } from '@/context/AlertContext';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Keyboard,
  Platform,
  Modal,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Bell,
  Shield,
  Palette,
  Info,
  ChevronRight,
  Save,
  Phone,
  MapPin,
  Lock,
  Eye,
  Moon,
  Smartphone,
  LogOut,
  FileText,
  HelpCircle,
  Mail,
  X,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { authenticatedRequest, logout, refresh } from '@/services/auth';
import LegalTermsModal from '@/components/LegalTermsModal';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const ACCESS_TOKEN_KEY = '@auth_access_token';

// --- Utilitários ---

// Tabela de lookup para decodificação base64 (compatível com Hermes — sem atob)
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = new Uint8Array(128);
for (let i = 0; i < BASE64_CHARS.length; i++) {
  BASE64_LOOKUP[BASE64_CHARS.charCodeAt(i)] = i;
}

/**
 * Decodifica uma string base64/base64url para string UTF-8.
 * Funciona no Hermes (sem depender de atob).
 */
function base64Decode(input: string): string {
  // Converte base64url para base64 padrão
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';

  const bytes: number[] = [];
  for (let i = 0; i < b64.length; i += 4) {
    const a = BASE64_LOOKUP[b64.charCodeAt(i)];
    const b = BASE64_LOOKUP[b64.charCodeAt(i + 1)];
    const c = BASE64_LOOKUP[b64.charCodeAt(i + 2)];
    const d = BASE64_LOOKUP[b64.charCodeAt(i + 3)];

    bytes.push((a << 2) | (b >> 4));
    if (b64[i + 2] !== '=') bytes.push(((b & 15) << 4) | (c >> 2));
    if (b64[i + 3] !== '=') bytes.push(((c & 3) << 6) | d);
  }

  // Decodifica bytes para string (loop para evitar limite de argumentos do Hermes)
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
}

/**
 * Decodifica o payload de um JWT (sem validação de assinatura).
 * Retorna o objeto JSON do payload.
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = base64Decode(parts[1]);
    return JSON.parse(decoded);
  } catch (e) {
    console.log('[JWT DECODE ERROR]', e);
    return null;
  }
}

/**
 * Máscara de telefone brasileiro: (XX) XXXXX-XXXX
 * Aceita apenas dígitos e limita a 11 números.
 */
function formatPhone(raw: string): string {
  // Remove tudo que não é dígito
  const digits = raw.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : '';
  }
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// --- Componentes auxiliares ---

function SectionHeader({ icon: Icon, title, delay = 0 }: { icon: any; title: string; delay?: number }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={styles.sectionHeader}>
      <View style={styles.sectionIconContainer}>
        <Icon color="#0d9488" size={18} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </Animated.View>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
  onPress,
  showChevron = true,
  showBadge = false,
  delay = 0,
}: {
  icon: any;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  showBadge?: boolean;
  delay?: number;
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        activeOpacity={onPress ? 0.6 : 1}
        disabled={!onPress}
      >
        <View style={styles.settingRowLeft}>
          <View style={styles.settingRowIcon}>
            <Icon color="#64748b" size={20} />
            {showBadge && <View style={styles.settingRowBadge} />}
          </View>
          <Text style={styles.settingRowLabel}>{label}</Text>
        </View>
        <View style={styles.settingRowRight}>
          {value && <Text style={styles.settingRowValue}>{value}</Text>}
          {showChevron && onPress && <ChevronRight color="#cbd5e1" size={18} />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function SettingToggleRow({
  icon: Icon,
  label,
  value,
  onValueChange,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  delay?: number;
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <View style={styles.settingRow}>
        <View style={styles.settingRowLeft}>
          <View style={styles.settingRowIcon}>
            <Icon color="#64748b" size={20} />
          </View>
          <Text style={styles.settingRowLabel}>{label}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#e2e8f0', true: '#99f6e4' }}
          thumbColor={value ? '#0d9488' : '#94a3b8'}
          ios_backgroundColor="#e2e8f0"
        />
      </View>
    </Animated.View>
  );
}

// --- Tela Principal ---

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { emailVerified, givenName, email, refreshEmailStatus } = useApp();

  // --- Estado dos campos da conta (UpdateUserRequest) ---
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Busca os dados do perfil do backend ao montar a tela
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileUrl = `${API_BASE_URL}/api/users/profile`;
        const data = await authenticatedRequest(profileUrl, { method: 'GET' });
        if (data.name) setName(data.name);
        if (data.phone) setPhone(formatPhone(data.phone));
        if (data.address) setAddress(data.address);
      } catch (err: any) {
        console.log('[SETTINGS] Erro ao buscar perfil:', err?.message);
        // Fallback: usa o givenName do JWT se disponível
        if (givenName && givenName !== 'Usuário') {
          setName(givenName);
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // --- Estados das configurações gerais ---
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [examReminders, setExamReminders] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(theme);
  const { showAlert } = useCustomAlert();

  // Estado para política e termos
  const [legalModalVisible, setLegalModalVisible] = useState(false);


  // Refs para navegação entre campos
  const phoneRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);

  // --- Handler para salvar dados da conta ---
  const handleSaveProfile = async () => {
    Keyboard.dismiss();

    // Remove a máscara do telefone para enviar apenas dígitos
    const cleanPhone = phone.replace(/\D/g, '');

    if (!name.trim() && !cleanPhone && !address.trim()) {
      showAlert('Atenção', 'Preencha pelo menos um campo para atualizar.');
      return;
    }

    setIsSaving(true);

    try {
      // Extrai o 'sub' (Keycloak ID) do JWT armazenado
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        showAlert('Sessão expirada', 'Faça login novamente para continuar.');
        return;
      }

      const payload = decodeJwtPayload(token);
      const userId = payload?.sub;
      if (!userId) {
        showAlert('Erro', 'Não foi possível identificar o usuário.');
        return;
      }

      // O backend mapeia a rota PUT /users sob o grupo /api e infere o ID do token de autenticação
      const updateUrl = `${API_BASE_URL}/api/users`;

      // Estrutura o body de acordo com models.UpdateUserRequest do backend
      const body: any = {};
      if (name.trim()) body.name = name.trim();
      if (cleanPhone) {
        body.phones = [{ phone: cleanPhone, principal: true }];
      }
      if (address.trim()) {
        body.addresses = [{ address: address.trim(), principal: true }];
      }

      await authenticatedRequest(updateUrl, {
        method: 'PUT',
        data: body,
        headers: { 'Content-Type': 'application/json' },
      });

      // Atualiza o token local e recarrega os dados para sincronizar o nome atualizado do Keycloak
      try {
        await refresh();
        await refreshEmailStatus();
      } catch (refreshErr) {
        console.log('[UPDATE PROFILE REFRESH TOKEN ERROR]', refreshErr);
      }

      showAlert('Sucesso ✅', 'Seus dados foram atualizados com sucesso!');
      setEditMode(false);
    } catch (err: any) {
      // Log detalhado para depurar o erro 404
      console.log('[DEBUG UPDATE USER ERROR DETAILS]');
      if (err?.config) {
        console.log('Request URL:', err.config.url);
        console.log('Request Method:', err.config.method);
        console.log('Request Data:', err.config.data);
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

      const backendMsg = err?.response?.data?.error;
      const message = backendMsg || err?.message || 'Erro ao atualizar dados';

      if (message.includes('Não autenticado')) {
        showAlert('Sessão expirada', 'Faça login novamente para continuar.');
      } else {
        showAlert('Erro', `${message} (Status: ${err?.response?.status || 'N/A'})`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    showAlert('Alterar Senha', 'Funcionalidade em desenvolvimento.');
  };

  const handleConfirmEmail = async () => {
    try {
      const verifyUrl = `${API_BASE_URL}/api/users/send-verify-email`;

      await authenticatedRequest(verifyUrl, {
        method: 'POST',
      });

      // Sucesso — navega para a tela de verificação de código
      router.push('/exam-flow/verify-email-code');
    } catch (err: any) {
      const backendMsg = err?.response?.data?.error;
      const message = backendMsg || err?.message || 'Erro ao enviar e-mail de verificação';
      console.log('[VERIFY EMAIL ERROR]', message);

      if (message.includes('Não autenticado') || message.includes('token inválido')) {
        showAlert('Sessão expirada', 'Faça login novamente para continuar.');
      } else {
        showAlert('Erro', message);
      }
    }
  };

  const handleLogout = () => {
    showAlert(
      'Sair da conta',
      'Tem certeza que deseja sair? Você precisará fazer login novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/');
            } catch (err) {
              console.log('[LOGOUT ERROR]', err);
              // Mesmo se der erro, tenta navegar para login
              router.replace('/');
            }
          },
        },
      ]
    );
  };



  const handleSupport = () => {
    showAlert(
      'Suporte Técnico',
      'E-mail: conjuntoaplicacoemedicinais@gmail.com\n\nDeseja enviar um e-mail para nossa equipe de suporte agora?',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Enviar E-mail',
          onPress: () => {
            Linking.openURL('mailto:conjuntoaplicacoemedicinais@gmail.com').catch((err) => {
              console.log('Error opening mail client', err);
              showAlert('Erro', 'Não foi possível abrir o aplicativo de e-mail.');
            });
          }
        }
      ]
    );
  };

  return (
    <>
      <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom + 32 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ===== SEÇÃO: CONTA ===== */}
      <SectionHeader icon={User} title="Conta" delay={100} />
      <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.card}>
        {/* Avatar / Iniciais */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {name ? name.charAt(0).toUpperCase() : (givenName !== 'Usuário' ? givenName.charAt(0).toUpperCase() : 'U')}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name || givenName || 'Seu Nome'}</Text>
            {email ? <Text style={styles.profileSubtext}>{email}</Text> : null}
            {isLoadingProfile ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.profileSubtext, { fontSize: 12 }]}>Carregando dados...</Text>
              </View>
            ) : (
              <Text style={[styles.profileSubtext, { fontSize: 12, marginTop: 4 }]}>Toque em editar para atualizar seus dados</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.editButton, editMode && styles.editButtonActive]}
            onPress={() => setEditMode(!editMode)}
            activeOpacity={0.7}
          >
            <Text style={[styles.editButtonText, editMode && styles.editButtonTextActive]}>
              {editMode ? 'Cancelar' : 'Editar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Campos de edição */}
        {editMode && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.editFieldsContainer}>
            {/* Nome */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <User color="#0d9488" size={16} />
                <Text style={styles.inputLabel}>Nome Completo</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Digite seu nome completo"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
            </View>

            {/* Telefone */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Phone color="#0d9488" size={16} />
                <Text style={styles.inputLabel}>Telefone</Text>
              </View>
              <TextInput
                ref={phoneRef}
                style={styles.textInput}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#94a3b8"
                value={phone}
                onChangeText={(text) => setPhone(formatPhone(text))}
                keyboardType="phone-pad"
                maxLength={15}
                returnKeyType="next"
                onSubmitEditing={() => addressRef.current?.focus()}
              />
            </View>

            {/* Endereço */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <MapPin color="#0d9488" size={16} />
                <Text style={styles.inputLabel}>Endereço</Text>
              </View>
              <TextInput
                ref={addressRef}
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder="Rua, número, bairro, cidade - UF"
                placeholderTextColor="#94a3b8"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
                returnKeyType="done"
                onSubmitEditing={handleSaveProfile}
              />
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Save color="#ffffff" size={18} style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      {/* Alterar Senha */}
      <SettingRow
        icon={Lock}
        label="Alterar Senha"
        onPress={handleChangePassword}
        delay={200}
      />

      <View style={styles.divider} />

      {/* Confirmar E-mail */}
      <SettingRow
        icon={Mail}
        label={emailVerified ? 'E-mail Confirmado' : 'Confirmar E-mail'}
        value={emailVerified ? '✅' : undefined}
        onPress={emailVerified ? undefined : handleConfirmEmail}
        showBadge={!emailVerified}
        showChevron={!emailVerified}
        delay={220}
      />

      {/* ===== SEÇÃO: NOTIFICAÇÕES ===== */}
      <SectionHeader icon={Bell} title="Notificações" delay={250} />
      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.card}>
        <SettingToggleRow
          icon={Bell}
          label="Notificações Push"
          value={pushNotifications}
          onValueChange={setPushNotifications}
        />
        <View style={styles.divider} />
        <SettingToggleRow
          icon={Bell}
          label="Notificações por E-mail"
          value={emailNotifications}
          onValueChange={setEmailNotifications}
        />
        <View style={styles.divider} />
        <SettingToggleRow
          icon={Bell}
          label="Lembretes de Exames"
          value={examReminders}
          onValueChange={setExamReminders}
        />
      </Animated.View>

      {/* ===== SEÇÃO: SEGURANÇA ===== */}
      <SectionHeader icon={Shield} title="Segurança" delay={350} />
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.card}>
        <SettingToggleRow
          icon={Smartphone}
          label="Bloqueio Biométrico"
          value={biometricLock}
          onValueChange={setBiometricLock}
        />
        <View style={styles.divider} />
        <SettingRow
          icon={Eye}
          label="Sessões Ativas"
          value="1 dispositivo"
          onPress={() => showAlert('Sessões', 'Gerenciamento de sessões em breve.')}
        />
      </Animated.View>

      {/* ===== SEÇÃO: APARÊNCIA ===== */}
      <SectionHeader icon={Palette} title="Aparência" delay={450} />
      <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.card}>
        <SettingToggleRow
          icon={Moon}
          label="Modo Escuro"
          value={isDarkMode}
          onValueChange={toggleTheme}
        />
      </Animated.View>

      {/* ===== SEÇÃO: PRIVACIDADE ===== */}
      <SectionHeader icon={Shield} title="Privacidade" delay={550} />
      <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.card}>
        <SettingRow
          icon={FileText}
          label="Termos e Privacidade"
          onPress={() => setLegalModalVisible(true)}
        />
      </Animated.View>


      {/* ===== SEÇÃO: SOBRE ===== */}
      <SectionHeader icon={Info} title="Sobre" delay={650} />
      <Animated.View entering={FadeInDown.delay(700).duration(500)} style={styles.card}>
        <SettingRow
          icon={Info}
          label="Versão do App"
          value="1.0.0"
          showChevron={false}
        />
        <View style={styles.divider} />
        <SettingRow
          icon={HelpCircle}
          label="Suporte"
          onPress={handleSupport}
        />
      </Animated.View>

      {/* ===== BOTÃO DE LOGOUT ===== */}
      <Animated.View entering={FadeInDown.delay(750).duration(500)}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut color="#ef4444" size={20} style={{ marginRight: 10 }} />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>

    {/* Modal para Políticas Legais */}
    <LegalTermsModal
      visible={legalModalVisible}
      onClose={() => setLegalModalVisible(false)}
    />

  </>
);
}

// --- ESTILOS ---
const getStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // --- Seção Header ---
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.card === '#ffffff' ? '#f0fdfa' : theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // --- Card ---
  card: {
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // --- Perfil Header ---
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
  },
  profileSubtext: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.primary,
    backgroundColor: 'transparent',
  },
  editButtonActive: {
    backgroundColor: theme.card === '#ffffff' ? '#fef2f2' : theme.border,
    borderColor: theme.danger,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  editButtonTextActive: {
    color: theme.danger,
  },

  // --- Campos de Edição ---
  editFieldsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: 0.2,
  },
  textInput: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: theme.text,
  },
  textInputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },

  // --- Botão Salvar ---
  saveButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  // --- Setting Row ---
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  settingRowBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.danger,
    borderWidth: 1.5,
    borderColor: theme.card,
  },
  settingRowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingRowValue: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '400',
  },

  // --- Divider ---
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 64,
  },

  // --- Logout ---
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.card === '#ffffff' ? '#fecaca' : theme.danger,
    ...Platform.select({
      ios: {
        shadowColor: theme.danger,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.danger,
  },
  // --- Legal Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: theme.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.card,
  },
  modalPrimaryButton: {
    backgroundColor: theme.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
