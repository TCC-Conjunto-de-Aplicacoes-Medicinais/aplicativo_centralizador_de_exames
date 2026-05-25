import { authenticatedRequest, getToken } from './auth';
import { MedicalExam, ExamType } from '../types/exam-flow-types';
import axios from 'axios';
import { createDPoPProof } from '@/security/dpop';
import { File as FSFile } from 'expo-file-system';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

function getExamName(linkBucket: string, examType: string): string {
  if (!linkBucket) return examType;
  try {
    const parts = linkBucket.split('/');
    const filename = parts[parts.length - 1];
    if (!filename) return examType;
    return decodeURIComponent(filename);
  } catch {
    return examType;
  }
}

function mapBackendExamToMedicalExam(exam: any): MedicalExam {
  const examDate = exam.date ? exam.date.split('T')[0] : new Date().toISOString().split('T')[0];
  
  return {
    id: exam.id,
    name: getExamName(exam.link_bucket, exam.exam_type),
    date: examDate,
    type: (exam.exam_type || ExamType.OTHER) as ExamType,
    status: 'completed',
    facility: exam.institution || undefined,
    results: exam.exam_result || undefined,
  };
}

/**
 * Faz o upload de um arquivo de exame junto com seus metadados.
 * A requisição é autenticada e assinada com prova DPoP.
 */
export async function uploadExam(formData: FormData): Promise<any> {
  if (!apiBaseUrl) {
    throw new Error('Variável de ambiente EXPO_PUBLIC_API_BASE_URL não está configurada.');
  }

  return authenticatedRequest(`${apiBaseUrl}/api/exams`, {
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Retorna todos os exames ativos do paciente logado.
 */
export async function getExams(): Promise<MedicalExam[]> {
  if (!apiBaseUrl) {
    throw new Error('Variável de ambiente EXPO_PUBLIC_API_BASE_URL não está configurada.');
  }

  const rawExams = await authenticatedRequest<any[]>(`${apiBaseUrl}/api/exams`, {
    method: 'GET',
  });

  return (rawExams || []).map(mapBackendExamToMedicalExam);
}

/**
 * Retorna os detalhes de um exame específico, incluindo a URL autenticada do arquivo.
 */
export async function getExamByID(id: string): Promise<MedicalExam> {
  if (!apiBaseUrl) {
    throw new Error('Variável de ambiente EXPO_PUBLIC_API_BASE_URL não está configurada.');
  }

  const rawExam = await authenticatedRequest<any>(`${apiBaseUrl}/api/exams/${id}`, {
    method: 'GET',
  });

  // Extrai informações do arquivo a partir do link_bucket
  // Formato: {backendBaseURL}/api/exams/file/{examId}/{filename}
  let fileUrl: string | undefined;
  let filename: string | undefined;

  if (rawExam.link_bucket) {
    const parts = rawExam.link_bucket.split('/');
    const rawFilename = parts[parts.length - 1];
    const rawExamId = parts[parts.length - 2];

    if (rawFilename && rawExamId) {
      filename = decodeURIComponent(rawFilename);
      // Usa o apiBaseUrl do app (pode diferir do baseURL do backend em produção)
      fileUrl = `${apiBaseUrl}/api/exams/file/${rawExamId}/${rawFilename}`;
    }
  }

  const mapped = mapBackendExamToMedicalExam(rawExam);
  return { ...mapped, fileUrl, filename };
}

/**
 * Faz o download do arquivo do exame de forma autenticada (com DPoP).
 * Retorna um ArrayBuffer com os bytes do arquivo e o content-type.
 */
export async function downloadExamFileBuffer(
  fileUrl: string
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const token = await getToken();
  if (!token) throw new Error('Não autenticado');

  const dpopProof = await createDPoPProof('GET', fileUrl);

  const response = await axios.get(fileUrl, {
    responseType: 'arraybuffer',
    headers: {
      Authorization: `DPoP ${token}`,
      DPoP: dpopProof,
    },
  });

  const rawContentType = response.headers['content-type'];
  const contentType: string = (typeof rawContentType === 'string' ? rawContentType : null) || 'application/octet-stream';
  return { buffer: response.data as ArrayBuffer, contentType };
}

/**
 * Faz o download do arquivo do exame de forma nativa e autenticada (com DPoP) diretamente para o destino.
 */
export async function downloadExamFileNative(
  fileUrl: string,
  destination: FSFile
): Promise<FSFile> {
  const token = await getToken();
  if (!token) throw new Error('Não autenticado');

  const dpopProof = await createDPoPProof('GET', fileUrl);

  return await FSFile.downloadFileAsync(fileUrl, destination, {
    headers: {
      Authorization: `DPoP ${token}`,
      DPoP: dpopProof,
    },
    idempotent: true,
  });
}

