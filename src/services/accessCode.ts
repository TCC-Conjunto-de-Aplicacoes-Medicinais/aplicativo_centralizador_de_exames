/**
 * Código de acesso para a clínica (10 minutos, uso único).
 *   POST /api/access-codes   gera o código; exige a assinatura da passkey ("access-code:generate").
 * A clínica digita o código com o CPF do paciente para importar o histórico.
 */

import { authenticatedRequest } from '@/services/auth';
import { confirmWithPasskey } from '@/services/passkey';
import { API_BASE_URL } from '@/constants/api';

export type AccessCode = { code: string; expiresAt: Date };

export async function generateAccessCode(): Promise<AccessCode> {
  const headers = await confirmWithPasskey('access-code:generate');
  const res = await authenticatedRequest<{ code: string; expires_at: string }>(`${API_BASE_URL}/api/access-codes`, {
    method: 'POST',
    headers,
  });
  return { code: res.code, expiresAt: new Date(res.expires_at) };
}
