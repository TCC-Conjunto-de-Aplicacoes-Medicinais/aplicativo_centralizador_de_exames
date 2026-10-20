/**
 * Consentimento do paciente (LGPD). Ligado à API do centralizador:
 *   POST   /api/consents        concede o acesso ao histórico clínico federado
 *   GET    /api/consents        lista as concessões do paciente
 *   DELETE /api/consents/:id    revoga uma concessão
 *
 * O back guarda a concessão para o histórico federado (escopo clinical_history_read).
 * Ele não guarda pedidos de médicos nem o nome de cada clínica: a concessão vale para as
 * clínicas federadas. Cada concessão e revogação exige a assinatura do paciente com a passkey
 * (app e web). O back confere a assinatura.
 */

import { authenticatedRequest } from '@/services/auth';
import { confirmWithPasskey } from '@/services/passkey';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.pohinc.com.br';
const CLINICAL_READ_SCOPE = 'clinical_history_read';

export type ConsentStatus = 'pending' | 'active' | 'revoked';

export interface ConsentItem {
  id: string;
  requesterName: string;
  requesterRole: string;
  institution: string;
  scope: string;
  reason: string;
  requestDate: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD ou '—' quando não há prazo
  status: ConsentStatus;
  examId?: string;
  authorizedAt?: string;
  revokedAt?: string;
}

/** Concessão como o back devolve (JSON das tabelas patient_consent). */
interface ApiConsent {
  id: string;
  scope: string;
  granted_at: string;
  valid_until?: string | null;
  revoked_at?: string | null;
}

function toItem(c: ApiConsent): ConsentItem {
  const granted = c.granted_at.split('T')[0];
  return {
    id: c.id,
    requesterName: 'Clínicas federadas do POHINC',
    requesterRole: 'Acesso ao histórico clínico',
    institution: 'Centralizador POHINC',
    scope: 'Histórico clínico federado (exames, laudos e prescrições)',
    reason: 'Concedido pelo paciente no aplicativo.',
    requestDate: granted,
    validUntil: c.valid_until ? c.valid_until.split('T')[0] : '—',
    status: c.revoked_at ? 'revoked' : 'active',
    authorizedAt: granted,
    revokedAt: c.revoked_at ? c.revoked_at.split('T')[0] : undefined,
  };
}

/** Lista as concessões do paciente (ativas e revogadas). */
export async function getConsents(): Promise<ConsentItem[]> {
  const list = await authenticatedRequest<ApiConsent[]>(`${API_BASE_URL}/api/consents`, { method: 'GET' });
  return (list || []).map(toItem);
}

/** Confirma a ação com a passkey do paciente (app e web). O back confere a assinatura. */
function confirmAction(action: string): Promise<Record<string, string>> {
  return confirmWithPasskey(action);
}

/** Concede o acesso ao histórico clínico federado (confirmação antes). */
export async function authorizeConsent(_id?: string): Promise<ConsentItem> {
  const headers = await confirmAction(`consent:grant:${CLINICAL_READ_SCOPE}`);
  const created = await authenticatedRequest<ApiConsent>(`${API_BASE_URL}/api/consents`, {
    method: 'POST',
    data: { scope: CLINICAL_READ_SCOPE },
    headers,
  });
  return toItem(created);
}

/** Revoga uma concessão (confirmação antes). */
export async function revokeConsent(id: string): Promise<ConsentItem> {
  const headers = await confirmAction(`consent:revoke:${id}`);
  await authenticatedRequest(`${API_BASE_URL}/api/consents/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
  const today = new Date().toISOString().split('T')[0];
  return {
    id,
    requesterName: 'Clínicas federadas do POHINC',
    requesterRole: 'Acesso ao histórico clínico',
    institution: 'Centralizador POHINC',
    scope: 'Histórico clínico federado (exames, laudos e prescrições)',
    reason: 'Revogado pelo paciente no aplicativo.',
    requestDate: today,
    validUntil: '—',
    status: 'revoked',
    revokedAt: today,
  };
}

/**
 * Concessão direta usada pela tela do exame. O back não guarda médico nem exame por concessão:
 * a concessão vale para o histórico federado. O médico e o exame ficam só na tela.
 */
export async function createDirectConsent(
  doctorName: string,
  institution: string,
  scope: string,
  validityDays: number = 30,
  examId?: string
): Promise<ConsentItem> {
  const headers = await confirmAction(`consent:grant:${CLINICAL_READ_SCOPE}`);
  const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();
  const created = await authenticatedRequest<ApiConsent>(`${API_BASE_URL}/api/consents`, {
    method: 'POST',
    data: { scope: CLINICAL_READ_SCOPE, valid_until: validUntil },
    headers,
  });
  return {
    ...toItem(created),
    requesterName: doctorName,
    institution: institution || 'Consultório Particular',
    scope,
    reason: 'Autorização expressa concedida pelo paciente.',
    examId,
  };
}
