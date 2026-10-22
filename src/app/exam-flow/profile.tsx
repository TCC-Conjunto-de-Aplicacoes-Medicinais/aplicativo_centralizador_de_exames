import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { authenticatedRequest } from '@/services/auth';
import { API_BASE_URL } from '@/constants/api';

type Profile = { name: string; cpf: string; birth_date: string; phone: string; insurance: string; blood_type: string; allergies: string };

/** Cadastro do paciente: telefone, convênio, tipo sanguíneo e alergias. A clínica recebe estes dados pelo centralizador. */
export default function ProfileScreen() {
  const { theme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ birth_date: '', phone: '', insurance: '', blood_type: '', allergies: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    authenticatedRequest<Profile>(`${API_BASE_URL}/api/patients/me`)
      .then((p) => {
        setProfile(p);
        setForm({ birth_date: p.birth_date || '', phone: p.phone || '', insurance: p.insurance || '', blood_type: p.blood_type || '', allergies: p.allergies || '' });
      })
      .catch(() => setMessage('Não foi possível carregar o cadastro.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await authenticatedRequest(`${API_BASE_URL}/api/patients/me`, { method: 'PUT', data: form });
      setMessage('Cadastro salvo.');
    } catch {
      setMessage('Não foi possível salvar. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  const fields: Array<{ key: keyof typeof form; label: string; hint?: string }> = [
    { key: 'birth_date', label: 'Data de nascimento', hint: 'AAAA-MM-DD' },
    { key: 'phone', label: 'Telefone' },
    { key: 'insurance', label: 'Convênio' },
    { key: 'blood_type', label: 'Tipo sanguíneo', hint: 'ex.: O+' },
    { key: 'allergies', label: 'Alergias', hint: 'separadas por vírgula' },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Meu cadastro' }} />
      <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <>
            {profile ? (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Nome</Text>
                <Text style={[styles.value, { color: theme.text }]}>{profile.name}</Text>
                <Text style={[styles.label, { color: theme.textSecondary }]}>CPF</Text>
                <Text style={[styles.value, { color: theme.text }]}>{profile.cpf}</Text>
              </View>
            ) : null}

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {fields.map((f) => (
                <View key={f.key} style={styles.field}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>
                    {f.label}
                    {f.hint ? ` (${f.hint})` : ''}
                  </Text>
                  <TextInput
                    value={form[f.key]}
                    onChangeText={(t) => setForm({ ...form, [f.key]: t })}
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              ))}
            </View>

            {message ? <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text> : null}

            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={save} disabled={saving} activeOpacity={0.8}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 10 },
  field: { gap: 6 },
  label: { fontSize: 13 },
  value: { fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  message: { fontSize: 13, textAlign: 'center' },
  button: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
