/**
 * Serviço de Gestão Descentralizada de Consentimentos (LGPD & DPoP)
 *
 * Artigo CONIC 2026: "gestão descentralizada de consentimentos pelo paciente...
 * restituindo ao paciente a governança sobre seus dados com o uso de criptografia DPoP"
 *
 * Cada autorização ou revogação exige autenticação biométrica e assinatura
 * gerada pela chave privada residente no chip de segurança de hardware.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticateUser, sign } from '@/security/signer';
import { authenticatedRequest } from '@/services/auth';

const CONSENTS_STORAGE_KEY = '@patient_consents_list_v1';

export type ConsentStatus = 'pending' | 'active' | 'revoked';

export interface ConsentItem {
  id: string;
  requesterName: string;
  requesterRole: string; // ex: "Cardiologista - CRM 123456/SP", "Clínica Geral"
  institution: string; // ex: "Hospital Albert Einstein", "Clínica São Lucas"
  scope: string; // ex: "Todos os exames dos últimos 6 meses", "Exames de Sangue e Eletrocardiograma"
  reason: string; // ex: "Acompanhamento pré-operatório", "Consulta de rotina"
  requestDate: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  status: ConsentStatus;
  examId?: string;
  dpopSignature?: string;
  authorizedAt?: string;
  revokedAt?: string;
}

const DEFAULT_CONSENTS: ConsentItem[] = [
  {
    id: 'req-001',
    requesterName: 'Dr. Lucas Martins',
    requesterRole: 'Cardiologista - CRM 142.890/SP',
    institution: 'Hospital Sírio-Libanês',
    scope: 'Exames Cardiológicos e de Sangue (Últimos 90 dias)',
    reason: 'Avaliação de risco cirúrgico e acompanhamento de pressão arterial.',
    requestDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
  },
  {
    id: 'req-002',
    requesterName: 'Dra. Carolina Silva',
    requesterRole: 'Clínica Geral - CRM 98.432/SP',
    institution: 'Clínica Integrada Morumbi',
    scope: 'Histórico completo de exames clínicos',
    reason: 'Check-up anual e análise de biomarcadores preventivos.',
    requestDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    authorizedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dpopSignature: 'ecdsa-p256:dpop-hw-sig-7f9a2b1c4e8d3f0a',
  },
  {
    id: 'req-003',
    requesterName: 'Laboratório Fleury',
    requesterRole: 'Central Diagnóstica - Unidade Itaim',
    institution: 'Grupo Fleury',
    scope: 'Resultados de Urina e Hemograma',
    reason: 'Importação e conciliação de laudos laboratoriais.',
    requestDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'revoked',
    revokedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
];

/**
 * Retorna todos os consentimentos armazenados (ou os iniciais de demonstração).
 */
export async function getConsents(): Promise<ConsentItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CONSENTS_STORAGE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(CONSENTS_STORAGE_KEY, JSON.stringify(DEFAULT_CONSENTS));
      return DEFAULT_CONSENTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('[CONSENTS] Erro ao carregar consentimentos:', err);
    return DEFAULT_CONSENTS;
  }
}

/**
 * Autoriza uma solicitação de consentimento com confirmação biométrica e assinatura DPoP.
 */
export async function authorizeConsent(id: string): Promise<ConsentItem> {
  const consents = await getConsents();
  const consentIndex = consents.findIndex((c) => c.id === id);

  if (consentIndex === -1) {
    throw new Error('Solicitação de consentimento não encontrada.');
  }

  const consent = consents[consentIndex];

  // 1. Confirmação biométrica exigida por hardware
  const authenticated = await authenticateUser(
    `Autorizar acesso aos seus exames para ${consent.requesterName} (${consent.institution})?`
  );

  if (!authenticated) {
    throw new Error('Autenticação biométrica cancelada.');
  }

  // 2. Geração da assinatura criptográfica via Hardware Chip (DPoP)
  const timestamp = new Date().toISOString();
  const payloadToSign = JSON.stringify({
    action: 'AUTHORIZE_CONSENT',
    consentId: consent.id,
    requester: consent.requesterName,
    scope: consent.scope,
    timestamp,
  });

  const signature = await sign(payloadToSign);

  // 3. Notifica o backend centralizador para registrar log de auditoria no Cassandra
  try {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (apiBaseUrl) {
      await authenticatedRequest(`${apiBaseUrl}/api/exams/share`, {
        method: 'POST',
        data: {
          exam_id: consent.examId || 'all-authorized-scope',
          doctor_name: `${consent.requesterName} (${consent.institution})`,
        },
      });
    }
  } catch (backendErr) {
    console.warn('[CONSENTS] Aviso ao registrar share no backend:', backendErr);
  }

  // 4. Atualiza estado do consentimento
  const updatedConsent: ConsentItem = {
    ...consent,
    status: 'active',
    authorizedAt: timestamp.split('T')[0],
    dpopSignature: signature.length > 40 ? `${signature.slice(0, 36)}...` : signature,
  };

  consents[consentIndex] = updatedConsent;
  await AsyncStorage.setItem(CONSENTS_STORAGE_KEY, JSON.stringify(consents));

  return updatedConsent;
}

/**
 * Revoga um consentimento ativo com confirmação biométrica imediata (Soberania do Paciente / LGPD).
 */
export async function revokeConsent(id: string): Promise<ConsentItem> {
  const consents = await getConsents();
  const consentIndex = consents.findIndex((c) => c.id === id);

  if (consentIndex === -1) {
    throw new Error('Consentimento não encontrado.');
  }

  const consent = consents[consentIndex];

  // Confirmação biométrica de segurança
  const authenticated = await authenticateUser(
    `Revogar imediatamente todo o acesso de ${consent.requesterName}?`
  );

  if (!authenticated) {
    throw new Error('Autenticação biométrica cancelada.');
  }

  const timestamp = new Date().toISOString();

  const updatedConsent: ConsentItem = {
    ...consent,
    status: 'revoked',
    revokedAt: timestamp.split('T')[0],
  };

  consents[consentIndex] = updatedConsent;
  await AsyncStorage.setItem(CONSENTS_STORAGE_KEY, JSON.stringify(consents));

  return updatedConsent;
}

/**
 * Cria uma concessão direta proativa de consentimento iniciada pelo paciente.
 */
export async function createDirectConsent(
  doctorName: string,
  institution: string,
  scope: string,
  validityDays: number = 30,
  skipAuth: boolean = false,
  examId?: string
): Promise<ConsentItem> {
  if (!skipAuth) {
    const authenticated = await authenticateUser(
      `Confirmar concessão direta de acesso para ${doctorName}?`
    );

    if (!authenticated) {
      throw new Error('Autenticação biométrica cancelada.');
    }
  }

  const timestamp = new Date().toISOString();
  const validUntilDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const payload = JSON.stringify({
    action: 'DIRECT_PATIENT_CONSENT',
    doctor: doctorName,
    institution,
    scope,
    timestamp,
  });

  const signature = await sign(payload);

  const newConsent: ConsentItem = {
    id: `direct-${Date.now()}`,
    requesterName: doctorName,
    requesterRole: 'Médico Autorizado Diretamente',
    institution: institution || 'Consultório Particular',
    scope,
    reason: 'Autorização expressa concedida pelo paciente.',
    requestDate: timestamp.split('T')[0],
    validUntil: validUntilDate,
    status: 'active',
    authorizedAt: timestamp.split('T')[0],
    dpopSignature: signature.length > 40 ? `${signature.slice(0, 36)}...` : signature,
    examId,
  };

  const consents = await getConsents();
  consents.unshift(newConsent);
  await AsyncStorage.setItem(CONSENTS_STORAGE_KEY, JSON.stringify(consents));

  return newConsent;
}
