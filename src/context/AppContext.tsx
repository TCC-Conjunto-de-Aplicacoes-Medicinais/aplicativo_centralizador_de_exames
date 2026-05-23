import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessRequest } from '../types/exam-flow-types';
import { mockAccessRequests } from '../data/mockData';

// --- Utilitários para decodificação JWT (compatível com Hermes) ---

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = new Uint8Array(128);
for (let i = 0; i < BASE64_CHARS.length; i++) {
  BASE64_LOOKUP[BASE64_CHARS.charCodeAt(i)] = i;
}

/** Base64/base64url decode para string (compatível com Hermes — sem atob) */
function base64Decode(input: string): string {
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';

  const bytes: number[] = [];
  for (let i = 0; i < b64.length; i += 4) {
    const a = BASE64_LOOKUP[b64.charCodeAt(i)];
    const b = BASE64_LOOKUP[b64.charCodeAt(i + 1)];
    const c = BASE64_LOOKUP[b64.charCodeAt(i + 2)];
    const d = BASE64_LOOKUP[b64.charCodeAt(i + 3)];

    bytes.push((a << 2) | (b >> 4));
    if (b64[i + 2] !== '=') bytes.push(((b & 15) << 4) | (c >> 2));
    if (b64[i + 3] !== '=') bytes.push(((c & 3) << 6) | d);
  }

  // Loop para evitar limite de argumentos do Hermes com spread
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
}

/** Decodifica o payload de um JWT (sem validar assinatura) */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = base64Decode(parts[1]);
    return JSON.parse(decoded);
  } catch (e) {
    console.log('[JWT DECODE ERROR]', e);
    return null;
  }
}

// --- Contexto ---

const ACCESS_TOKEN_KEY = '@auth_access_token';

interface AppContextType {
  accessRequests: AccessRequest[];
  unreadCount: number;
  emailVerified: boolean;
  givenName: string;
  email: string;
  markAsRead: (id: string) => void;
  approveRequest: (id: string) => void;
  denyRequest: (id: string) => void;
  refreshEmailStatus: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(mockAccessRequests);
  const [emailVerified, setEmailVerified] = useState(true); // default true para não piscar
  const [givenName, setGivenName] = useState('Usuário');
  const [email, setEmail] = useState('');

  const unreadCount = accessRequests.filter(
    (req) => req.status === 'pending' && !req.read
  ).length;

  /** Lê o access_token do AsyncStorage e extrai email_verified */
  const refreshEmailStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) return;

      const payload = decodeJwtPayload(token);
      if (payload) {
        if (typeof payload.email_verified === 'boolean') {
          setEmailVerified(payload.email_verified);
          console.log('[APP] email_verified:', payload.email_verified);
        }
        if (typeof payload.given_name === 'string') {
          setGivenName(payload.given_name);
        }
        if (typeof payload.email === 'string') {
          setEmail(payload.email);
        }
      }
    } catch (err) {
      console.log('[APP] Erro ao ler dados do token:', err);
    }
  }, []);

  // Carrega o status do email ao montar o provider
  useEffect(() => {
    refreshEmailStatus();
  }, [refreshEmailStatus]);

  const markAsRead = (id: string) => {
    setAccessRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, read: true } : req))
    );
  };

  const approveRequest = (id: string) => {
    setAccessRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: 'approved', read: true } : req
      )
    );
  };

  const denyRequest = (id: string) => {
    setAccessRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: 'denied', read: true } : req
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        accessRequests,
        unreadCount,
        emailVerified,
        givenName,
        email,
        markAsRead,
        approveRequest,
        denyRequest,
        refreshEmailStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}