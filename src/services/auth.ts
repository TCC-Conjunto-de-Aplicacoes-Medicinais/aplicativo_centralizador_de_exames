/**
 * Serviço de Autenticação com DPoP
 *
 * Gerencia signup, login, refresh, logout, e armazenamento seguro de tokens.
 * Integra com o módulo DPoP para proof-of-possession.
 *
 * O refresh token é tratado de forma transparente:
 *   - getToken() renova automaticamente quando o access_token expira.
 *   - authenticatedRequest() faz retry automático com novo token se receber 401.
 *   - Um mutex garante que apenas UM refresh execute por vez (evita race conditions).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { createDPoPProof, clearDPoPKeys, exportPublicJWK } from '@/security/dpop';

// --- Configuração ---
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const SIGNUP_ENDPOINT = `${API_BASE_URL}/api/signup`;
const LOGIN_ENDPOINT = `${API_BASE_URL}/api/login`;
const REFRESH_ENDPOINT = `${API_BASE_URL}/api/refresh`;

// --- Chaves para persistência ---
const ACCESS_TOKEN_KEY = '@auth_access_token';
const REFRESH_TOKEN_KEY = '@auth_refresh_token';
const TOKEN_EXPIRY_KEY = '@auth_token_expiry';

// --- Tipos ---
export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SignupResponse {
  message: string;
}

export interface AuthError {
  error: string;
}

// --- Mutex para refresh (evita race conditions) ---
let refreshPromise: Promise<RefreshResponse> | null = null;

// --- Funções principais ---

/**
 * Cadastra um novo paciente.
 *
 * Envia os dados do paciente junto com informações do dispositivo
 * (nome e chave pública DPoP) para o backend.
 *
 * @throws Error com mensagem do backend em caso de falha
 */
export async function signup(
  name: string,
  email: string,
  password: string,
  cpf: string,
): Promise<SignupResponse> {
  // Gera a chave DPoP do dispositivo (será reutilizada no login)
  const dpopProof = await createDPoPProof('POST', SIGNUP_ENDPOINT);

  // Monta informações do dispositivo
  const deviceName = Device.deviceName || Device.modelName || 'dispositivo-desconhecido';

  // Exporta a chave pública JWK diretamente do módulo DPoP
  const jwk = await exportPublicJWK();
  const publicKeyJWK = JSON.stringify(jwk);

  try {
    const response = await axios.post<SignupResponse>(SIGNUP_ENDPOINT, {
      name,
      email,
      password,
      cpf,
      device: {
        public_key: publicKeyJWK,
        device_name: deviceName,
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      const errorMessage = (err.response.data as AuthError)?.error || `Erro ${err.response.status}`;
      throw new Error(errorMessage);
    }
    throw err;
  }
}

/**
 * Realiza login com DPoP.
 *
 * 1. Cria DPoP Proof JWT (assinado com chave do dispositivo)
 * 2. Envia POST /api/login com header DPoP e credenciais
 * 3. Armazena tokens recebidos
 *
 * @throws Error com mensagem do backend em caso de falha
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  // Cria o DPoP proof para esta requisição específica
  const dpopProof = await createDPoPProof('POST', LOGIN_ENDPOINT);

  try {
    const response = await axios.post<LoginResponse>(LOGIN_ENDPOINT, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json',
        'DPoP': dpopProof,
      },
    });

    const loginData = response.data;

    // Armazena tokens de forma segura
    const expiresAt = Date.now() + loginData.expires_in * 1000;
    await Promise.all([
      AsyncStorage.setItem(ACCESS_TOKEN_KEY, loginData.access_token),
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, loginData.refresh_token),
      AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString()),
    ]);

    console.log('[AUTH] Login realizado. Token expira em', loginData.expires_in, 'segundos');

    return loginData;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      const errorMessage = (err.response.data as AuthError)?.error || `Erro ${err.response.status}`;
      throw new Error(errorMessage);
    }
    throw err;
  }
}

/**
 * Renova o access token usando o refresh token.
 *
 * Usa um mutex (refreshPromise) para garantir que apenas uma chamada
 * de refresh ocorra por vez. Chamadas simultâneas reutilizam a mesma Promise.
 *
 * @throws Error se não houver refresh token ou se a renovação falhar
 */
export async function refresh(): Promise<RefreshResponse> {
  // Se já existe um refresh em andamento, reutiliza a Promise
  if (refreshPromise) {
    console.log('[AUTH] Refresh já em andamento, reutilizando...');
    return refreshPromise;
  }

  // Cria a Promise e armazena no mutex
  refreshPromise = _doRefresh();

  try {
    return await refreshPromise;
  } finally {
    // Limpa o mutex ao finalizar (sucesso ou erro)
    refreshPromise = null;
  }
}

/**
 * Execução interna do refresh (chamada apenas pelo mutex).
 */
async function _doRefresh(): Promise<RefreshResponse> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    throw new Error('Nenhum refresh token disponível');
  }

  console.log('[AUTH] Iniciando refresh do token...');
  const dpopProof = await createDPoPProof('POST', REFRESH_ENDPOINT);

  try {
    const response = await axios.post<RefreshResponse>(REFRESH_ENDPOINT, {
      refresh_token: refreshToken
    }, {
      headers: {
        'Content-Type': 'application/json',
        'DPoP': dpopProof,
      },
    });

    const refreshData = response.data;

    // Atualiza tokens
    const expiresAt = Date.now() + refreshData.expires_in * 1000;
    await Promise.all([
      AsyncStorage.setItem(ACCESS_TOKEN_KEY, refreshData.access_token),
      AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString()),
      // Atualiza refresh token se vier um novo (Keycloak geralmente rotaciona)
      refreshData.refresh_token
        ? AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshData.refresh_token)
        : Promise.resolve(),
    ]);

    console.log('[AUTH] Refresh concluído. Novo token expira em', refreshData.expires_in, 'segundos');

    return refreshData;
  } catch (err) {
    console.log('[AUTH] Falha no refresh, realizando logout...');
    // Se refresh falhar, limpa tudo (sessão inválida)
    await logout();
    if (axios.isAxiosError(err) && err.response) {
      const errorMessage = (err.response.data as AuthError)?.error || `Erro ${err.response.status}`;
      throw new Error(errorMessage);
    }
    throw err;
  }
}

/**
 * Realiza logout: limpa tokens e chaves DPoP.
 */
export async function logout(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    AsyncStorage.removeItem(TOKEN_EXPIRY_KEY),
    clearDPoPKeys(),
  ]);
  console.log('[AUTH] Logout realizado, tokens limpos.');
}

/**
 * Retorna o access token armazenado, ou null se não existir/expirado.
 * Se o token estiver expirado, tenta renovar automaticamente.
 *
 * Aplica uma margem de segurança de 30 segundos para evitar usar
 * um token que está prestes a expirar.
 */
export async function getToken(): Promise<string | null> {
  const [token, expiryStr] = await Promise.all([
    AsyncStorage.getItem(ACCESS_TOKEN_KEY),
    AsyncStorage.getItem(TOKEN_EXPIRY_KEY),
  ]);

  if (!token || !expiryStr) return null;

  const expiresAt = parseInt(expiryStr, 10);
  const SAFETY_MARGIN_MS = 30 * 1000; // 30 segundos de margem

  if (Date.now() >= expiresAt - SAFETY_MARGIN_MS) {
    // Token expirado ou prestes a expirar — tenta refresh
    console.log('[AUTH] Token expirado/prestes a expirar, tentando refresh...');
    try {
      await refresh();
      return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  return token;
}

/**
 * Verifica se o usuário está autenticado (tem token válido).
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}

/**
 * Faz uma requisição autenticada com DPoP.
 * Adiciona automaticamente o header Authorization com DPoP token
 * e o header DPoP com um novo proof.
 *
 * Se a requisição falhar com 401 (token expirado entre getToken e a request),
 * tenta renovar o token e refaz a requisição automaticamente (1 retry).
 */
export async function authenticatedRequest<T = any>(
  url: string,
  options: AxiosRequestConfig = {},
): Promise<T> {
  // Primeira tentativa
  try {
    return await _executeAuthenticatedRequest<T>(url, options);
  } catch (err) {
    // Se recebeu 401, tenta refresh e retry
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      console.log('[AUTH] Requisição retornou 401, tentando refresh + retry...');
      try {
        await refresh();
        // Retry com o novo token
        return await _executeAuthenticatedRequest<T>(url, options);
      } catch (retryErr) {
        // Se o retry também falhar, propaga o erro
        console.log('[AUTH] Retry após refresh falhou.');
        throw retryErr;
      }
    }
    throw err;
  }
}

/**
 * Executa uma requisição autenticada com DPoP (sem retry).
 * Usada internamente por authenticatedRequest.
 */
async function _executeAuthenticatedRequest<T = any>(
  url: string,
  options: AxiosRequestConfig = {},
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new Error('Não autenticado');
  }

  const method = (options.method || 'GET').toUpperCase();
  const dpopProof = await createDPoPProof(method, url);

  const response = await axios({
    url,
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `DPoP ${token}`,
      'DPoP': dpopProof,
    },
  });

  return response.data;
}
