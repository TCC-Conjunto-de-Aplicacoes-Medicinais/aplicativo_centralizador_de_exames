import { Platform } from 'react-native';

/**
 * Retorna a URL base da API centralizadora.
 * - Na Web (PWA): padrão vazio ("") para usar o proxy reverso do Nginx e eliminar CORS.
 * - No Mobile Nativo (Android/iOS): padrão público ou definido em EXPO_PUBLIC_API_BASE_URL.
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL !== undefined
    ? process.env.EXPO_PUBLIC_API_BASE_URL
    : Platform.OS === 'web'
    ? ''
    : 'https://api.pohinc.com.br';
