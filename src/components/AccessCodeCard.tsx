import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { generateAccessCode, AccessCode } from '@/services/accessCode';

/** Gera o código de 6 dígitos que o paciente mostra para a clínica (vale 10 minutos, uso único). */
export default function AccessCodeCard() {
  const { theme } = useTheme();
  const [access, setAccess] = useState<AccessCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setBusy(true);
    setError(null);
    try {
      setAccess(await generateAccessCode());
    } catch {
      setError('Não foi possível gerar o código. Confirme com a passkey e tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  const hhmm = access?.expiresAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.text }]}>Código para a clínica</Text>
      <Text style={[styles.desc, { color: theme.textSecondary }]}>
        Mostre este código ao médico. Ele vale por 10 minutos e só pode ser usado uma vez.
      </Text>

      {access ? (
        <View style={styles.codeBox}>
          <Text style={styles.code}>{access.code}</Text>
          <Text style={[styles.desc, { color: theme.textSecondary }]}>Válido até {hhmm}</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleGenerate} disabled={busy} activeOpacity={0.8}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{access ? 'Gerar novo código' : 'Gerar código'}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13 },
  codeBox: { alignItems: 'center', paddingVertical: 12, gap: 4 },
  code: { fontSize: 36, fontWeight: '800', letterSpacing: 8, color: '#0D9488' },
  error: { color: '#dc2626', fontSize: 13 },
  button: { backgroundColor: '#0D9488', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
