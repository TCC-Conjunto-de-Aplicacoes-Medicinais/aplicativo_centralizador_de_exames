// Type definitions for the Medical Exam Management App

export type ExamStatus = 'completed' | 'pending' | 'processing';
export type ExamType = 'blood-test' | 'imaging' | 'cardiology' | 'urine-test' | 'report';
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
