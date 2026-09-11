/**
 * Storage Seguro Vinculado a Hardware (Keystore / Keychain)
 *
 * Utiliza `expo-secure-store` para persistir segredos criptografados no chip
 * de hardware (Android Keystore e iOS Keychain).
 *
 * Inclui sanitização de chaves para compatibilidade estrita com Android Keystore
 * (que não aceita caracteres como '@' nas chaves) e fallback seguro caso necessário.
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Sanitiza a chave para o padrão aceito pelo expo-secure-store (alphanumeric, '.', '-', '_') */
function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Salva um valor de forma segura no SecureStore.
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  const safeKey = sanitizeKey(key);
  try {
    await SecureStore.setItemAsync(safeKey, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  } catch (err) {
    console.warn(`[storage] Erro ao gravar no SecureStore para "${safeKey}", usando fallback:`, err);
    await AsyncStorage.setItem(key, value);
  }
}

/**
 * Recupera um valor do SecureStore.
 * Se não encontrar, tenta ler do AsyncStorage legado para migração transparente.
 */
export async function getSecureItem(key: string): Promise<string | null> {
  const safeKey = sanitizeKey(key);
  try {
    const value = await SecureStore.getItemAsync(safeKey);
    if (value !== null) {
      return value;
    }
  } catch (err) {
    console.warn(`[storage] Erro ao ler do SecureStore para "${safeKey}":`, err);
  }

  // Fallback / Migração de versão legada em AsyncStorage
  try {
    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue !== null) {
      // Migra para o SecureStore e remove do AsyncStorage
      await setSecureItem(key, legacyValue);
      await AsyncStorage.removeItem(key);
      return legacyValue;
    }
  } catch (err) {
    console.warn(`[storage] Erro ao ler AsyncStorage fallback para "${key}":`, err);
  }

  return null;
}

/**
 * Remove um valor do SecureStore e do AsyncStorage.
 */
export async function removeSecureItem(key: string): Promise<void> {
  const safeKey = sanitizeKey(key);
  try {
    await SecureStore.deleteItemAsync(safeKey);
  } catch (err) {
    console.warn(`[storage] Erro ao remover do SecureStore para "${safeKey}":`, err);
  }

  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Silencioso
  }
}

export default {
  getItem: getSecureItem,
  setItem: setSecureItem,
  removeItem: removeSecureItem,
};
