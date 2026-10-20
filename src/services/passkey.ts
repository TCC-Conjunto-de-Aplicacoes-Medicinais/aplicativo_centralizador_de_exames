/**
 * Passkey (WebAuthn) do paciente na web. O back cria o desafio e confere a assinatura;
 * o navegador só cria a chave e assina. Recuperação: código por e-mail + passkey nova.
 */

import { create, get } from 'react-native-passkeys';
import { isAxiosError } from 'axios';
import { authenticatedRequest } from '@/services/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.pohinc.com.br';

interface PasskeyChallenge {
  challenge_id: string;
  options: { publicKey: any };
}

/** Base64url do JSON, que é o formato do header X-Passkey-Assertion. */
function toBase64Url(text: string): string {
  let binary = '';
  new TextEncoder().encode(text).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Cadastra uma passkey para o paciente logado. */
export async function registerPasskey(): Promise<void> {
  const begin = await authenticatedRequest<PasskeyChallenge>(`${API_BASE_URL}/api/passkeys/register/begin`, {
    method: 'POST',
  });
  const attestation = await create(begin.options.publicKey);
  if (!attestation) {
    throw new Error('Cadastro de passkey cancelado.');
  }
  await authenticatedRequest(`${API_BASE_URL}/api/passkeys/register/finish`, {
    method: 'POST',
    headers: { 'X-Passkey-Challenge': begin.challenge_id },
    data: attestation,
  });
}

/** Assina uma ação com a passkey e devolve os headers que o back confere. */
export async function passkeyHeadersFor(action: string): Promise<Record<string, string>> {
  const begin = await authenticatedRequest<PasskeyChallenge>(`${API_BASE_URL}/api/passkeys/action/begin`, {
    method: 'POST',
    data: { action },
  });
  const assertion = await get(begin.options.publicKey);
  if (!assertion) {
    throw new Error('Assinatura com passkey cancelada.');
  }
  return {
    'X-Passkey-Challenge': begin.challenge_id,
    'X-Passkey-Assertion': toBase64Url(JSON.stringify(assertion)),
  };
}

/** Assina a ação; se o paciente ainda não tem passkey, cadastra uma e assina de novo. */
export async function confirmWithPasskey(action: string): Promise<Record<string, string>> {
  try {
    return await passkeyHeadersFor(action);
  } catch (err) {
    if (!isAxiosError(err) || err.response?.status !== 403) {
      throw err;
    }
    await registerPasskey();
    return passkeyHeadersFor(action);
  }
}

async function postPublic<T>(path: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Falha na recuperação da passkey.');
  }
  return data as T;
}

/** Envia o código de recuperação para o e-mail do paciente. */
export async function requestRecoveryCode(email: string): Promise<void> {
  await postPublic('/api/passkeys/recovery/request', { email });
}

/** Troca o código recebido por um token de uso único para cadastrar a nova passkey. */
export async function verifyRecoveryCode(email: string, code: string): Promise<string> {
  const data = await postPublic<{ recovery_token: string }>('/api/passkeys/recovery/verify', { email, code });
  return data.recovery_token;
}

/** Cadastra a passkey nova usando o token de recuperação (sem login). */
export async function registerRecoveryPasskey(recoveryToken: string): Promise<void> {
  const begin = await postPublic<PasskeyChallenge>('/api/passkeys/recovery/register/begin', undefined, {
    'X-Recovery-Token': recoveryToken,
  });
  const attestation = await create(begin.options.publicKey);
  if (!attestation) {
    throw new Error('Cadastro de passkey cancelado.');
  }
  await postPublic('/api/passkeys/recovery/register/finish', attestation, {
    'X-Recovery-Token': recoveryToken,
    'X-Passkey-Challenge': begin.challenge_id,
  });
}
