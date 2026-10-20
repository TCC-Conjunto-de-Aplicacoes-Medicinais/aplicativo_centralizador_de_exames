import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  requestRecoveryCode,
  verifyRecoveryCode,
  registerRecoveryPasskey,
} from '@/services/passkey';

type Step = 'email' | 'code' | 'done';

/** Recuperação da passkey: e-mail -> código de 6 dígitos -> cadastro de passkey nova. */
export default function PasskeyRecoveryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível concluir. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      await requestRecoveryCode(email.trim());
      setStep('code');
    });

  const checkCode = () =>
    run(async () => {
      const token = await verifyRecoveryCode(email.trim(), code.trim());
      await registerRecoveryPasskey(token);
      setStep('done');
    });

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Recuperar acesso</Text>

      {step === 'email' && (
        <>
          <Text style={[styles.text, { color: theme.text }]}>
            Informe o e-mail do seu cadastro. Enviaremos um código para cadastrar uma nova passkey.
          </Text>
          <Input
            placeholder="E-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Button onPress={sendCode} disabled={busy || !email.trim()}>
            {busy ? 'Enviando...' : 'Enviar código'}
          </Button>
        </>
      )}

      {step === 'code' && (
        <>
          <Text style={[styles.text, { color: theme.text }]}>
            Digite o código de 6 dígitos enviado para {email.trim()}. Ele vale por 10 minutos.
          </Text>
          <Input
            placeholder="Código"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
          <Button onPress={checkCode} disabled={busy || code.trim().length !== 6}>
            {busy ? 'Verificando...' : 'Confirmar e cadastrar passkey'}
          </Button>
        </>
      )}

      {step === 'done' && (
        <>
          <Text style={[styles.text, { color: theme.text }]}>Passkey cadastrada. Você já pode entrar e autorizar acessos.</Text>
          <Button onPress={() => router.replace('/')}>Voltar ao login</Button>
        </>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
  },
});
