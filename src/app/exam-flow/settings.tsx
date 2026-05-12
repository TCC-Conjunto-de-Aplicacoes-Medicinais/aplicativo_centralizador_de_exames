import React, { useState, useRef } from 'react';
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
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { authenticatedRequest, logout } from '@/services/auth';

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

  // Decodifica UTF-8 bytes para string
  return String.fromCharCode(...bytes);
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
  delay = 0,
}: {
  icon: any;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  delay?: number;
}) {
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

  // --- Estado dos campos da conta (UpdateUserRequest) ---
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // --- Estados das configurações gerais ---
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [examReminders, setExamReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometricLock, setBiometricLock] = useState(false);

  // Refs para navegação entre campos
  const phoneRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);

  // --- Handler para salvar dados da conta ---
  const handleSaveProfile = async () => {
    Keyboard.dismiss();

    // Remove a máscara do telefone para enviar apenas dígitos
    const cleanPhone = phone.replace(/\D/g, '');

    if (!name.trim() && !cleanPhone && !address.trim()) {
      Alert.alert('Atenção', 'Preencha pelo menos um campo para atualizar.');
      return;
    }

    setIsSaving(true);

    try {
      // Extrai o 'sub' (Keycloak ID) do JWT armazenado
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
        return;
      }

      const payload = decodeJwtPayload(token);
      const userId = payload?.sub;
      if (!userId) {
        Alert.alert('Erro', 'Não foi possível identificar o usuário.');
        return;
      }

      const updateUrl = `${API_BASE_URL}/api/users/${userId}`;

      const body: Record<string, string> = {};
      if (name.trim()) body.name = name.trim();
      if (cleanPhone) body.phone = cleanPhone;
      if (address.trim()) body.address = address.trim();

      await authenticatedRequest(updateUrl, {
        method: 'PUT',
        data: body,
        headers: { 'Content-Type': 'application/json' },
      });

      Alert.alert('Sucesso ✅', 'Seus dados foram atualizados com sucesso!');
      setEditMode(false);
    } catch (err: any) {
      // Extrai a mensagem real do backend (ex: err.response.data.error)
      const backendMsg = err?.response?.data?.error;
      const message = backendMsg || err?.message || 'Erro ao atualizar dados';
      console.log('[UPDATE USER ERROR]', message, err?.response?.status);

      if (message.includes('Não autenticado')) {
        Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
      } else {
        Alert.alert('Erro', message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Alterar Senha', 'Funcionalidade em desenvolvimento.');
  };

  const handleLogout = () => {
    Alert.alert(
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

  const handlePrivacyPolicy = () => {
    Alert.alert('Política de Privacidade', 'Documento em preparação.');
  };

  const handleTerms = () => {
    Alert.alert('Termos de Uso', 'Documento em preparação.');
  };

  const handleSupport = () => {
    Alert.alert('Suporte', 'Entre em contato: suporte@centralizador.com');
  };

  return (
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
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name || 'Seu Nome'}</Text>
            <Text style={styles.profileSubtext}>Toque em editar para atualizar seus dados</Text>
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
          onPress={() => Alert.alert('Sessões', 'Gerenciamento de sessões em breve.')}
        />
      </Animated.View>

      {/* ===== SEÇÃO: APARÊNCIA ===== */}
      <SectionHeader icon={Palette} title="Aparência" delay={450} />
      <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.card}>
        <SettingToggleRow
          icon={Moon}
          label="Modo Escuro"
          value={darkMode}
          onValueChange={setDarkMode}
        />
      </Animated.View>

      {/* ===== SEÇÃO: PRIVACIDADE ===== */}
      <SectionHeader icon={Shield} title="Privacidade" delay={550} />
      <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.card}>
        <SettingRow
          icon={FileText}
          label="Política de Privacidade"
          onPress={handlePrivacyPolicy}
        />
        <View style={styles.divider} />
        <SettingRow
          icon={FileText}
          label="Termos de Uso"
          onPress={handleTerms}
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
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // --- Card ---
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#0d9488',
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
    color: '#0f172a',
  },
  profileSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0d9488',
    backgroundColor: 'transparent',
  },
  editButtonActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0d9488',
  },
  editButtonTextActive: {
    color: '#ef4444',
  },

  // --- Campos de Edição ---
  editFieldsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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
    color: '#475569',
    letterSpacing: 0.2,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: '#0f172a',
  },
  textInputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },

  // --- Botão Salvar ---
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#0d9488',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#0d9488',
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
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingRowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingRowValue: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '400',
  },

  // --- Divider ---
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
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
    color: '#ef4444',
  },
});
