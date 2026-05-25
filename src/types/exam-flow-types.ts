// Type definitions for the Medical Exam Management App

export type ExamStatus = 'completed' | 'pending' | 'processing';
export enum ExamType {
  BLOOD_TEST = 'blood-test',
  URINE_TEST = 'urine-test',
  IMAGING = 'imaging',
  CARDIOLOGY = 'cardiology',
  REPORT = 'report',
  ULTRASOUND = 'ultrasound',
  XRAY = 'xray',
  MRI = 'mri',
  CT_SCAN = 'ct-scan',
  ECG = 'ecg',
  EEG = 'eeg',
  ENDOSCOPY = 'endoscopy',
  BIOMARKER = 'biomarker',
  OTHER = 'other',
}

export const ExamTypeLabels: Record<ExamType, string> = {
  [ExamType.BLOOD_TEST]: 'Exame de Sangue',
  [ExamType.URINE_TEST]: 'Exame de Urina',
  [ExamType.IMAGING]: 'Exame de Imagem',
  [ExamType.CARDIOLOGY]: 'Cardiologia',
  [ExamType.REPORT]: 'Relatório/Laudo Médico',
  [ExamType.ULTRASOUND]: 'Ultrassonografia',
  [ExamType.XRAY]: 'Radiografia (Raio-X)',
  [ExamType.MRI]: 'Ressonância Magnética',
  [ExamType.CT_SCAN]: 'Tomografia Computadorizada',
  [ExamType.ECG]: 'Eletrocardiograma (ECG)',
  [ExamType.EEG]: 'Eletroencefalograma (EEG)',
  [ExamType.ENDOSCOPY]: 'Endoscopia',
  [ExamType.BIOMARKER]: 'Biomarcador',
  [ExamType.OTHER]: 'Outro',
};
export type RequestStatus = 'pending' | 'approved' | 'denied';

export interface MedicalExam {
  id: string;
  name: string;
  date: string;
  type: ExamType;
  status: ExamStatus;
  description?: string;
  facility?: string;
  results?: string;
  /** URL autenticada do arquivo no backend (ex: /api/exams/file/{id}/{filename}) */
  fileUrl?: string;
  /** Nome original do arquivo */
  filename?: string;
}

export interface AccessRequest {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  examId: string;
  examName: string;
  requestDate: string;
  reason: string;
  status: RequestStatus;
  read: boolean;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
}
