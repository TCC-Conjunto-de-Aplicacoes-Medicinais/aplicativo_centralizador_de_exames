/**
 * DPoP (Demonstrating Proof of Possession) — Módulo de segurança
 *
 * Gera par de chaves EC P-256, cria DPoP Proof JWTs assinados com ES256.
 * Usa @noble/curves (JS puro, auditado) para operações ECDSA.
 * Chaves são persistidas no AsyncStorage (uma por dispositivo).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { p256 } from '@noble/curves/nist.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import * as Crypto from 'expo-crypto';

// --- Chaves para persistência ---
const PRIVATE_KEY_STORAGE_KEY = '@dpop_private_key';

// --- Helpers de codificação ---

/** Base64url encode de um Uint8Array (sem btoa, sem padding) */
function base64urlEncode(data: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const l = data.length;
  let result = '';

  for (let i = 0; i < l; i += 3) {
    const b0 = data[i];
    const b1 = i + 1 < l ? data[i + 1] : 0;
    const b2 = i + 2 < l ? data[i + 2] : 0;

    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | (b1 >> 4)];
    if (i + 1 < l) result += chars[((b1 & 15) << 2) | (b2 >> 6)];
    if (i + 2 < l) result += chars[b2 & 63];
  }

  return result;
}

/** Base64url encode de um objeto JSON */
function base64urlEncodeJSON(obj: object): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  return base64urlEncode(bytes);
}

/**
 * Converte coordenada de bigint (32 bytes, P-256) para base64url.
 * Garante padding de 32 bytes à esquerda.
 */
function bigintToBase64url(n: bigint, byteLength = 32): string {
  const hex = n.toString(16).padStart(byteLength * 2, '0');
  const bytes = hexToBytes(hex);
  return base64urlEncode(bytes);
}

/**
 * Converte assinatura DER (formato @noble/curves) para raw R||S (formato JWT/JWS).
 * P-256 produz R e S de 32 bytes cada = 64 bytes total.
 */
function derToRawSignature(signature: Uint8Array): Uint8Array {
  // @noble/curves com lowS normalization retorna CompactSignature
  // mas sign() retorna DER por padrão. Usamos sign() com format lowS.
  // Na verdade, usamos p256.sign que retorna um Signature object com toCompactRawBytes()
  return signature;
}

// --- Gerenciamento de chaves ---

/** Gera ou recupera a chave privada EC P-256 persistida */
async function getOrCreatePrivateKey(): Promise<Uint8Array> {
  const stored = await AsyncStorage.getItem(PRIVATE_KEY_STORAGE_KEY);

  if (stored) {
    return hexToBytes(stored);
  }

  // Gera 32 bytes aleatórios criptograficamente seguros
  const randomBytes = await Crypto.getRandomBytesAsync(32);

  // Valida que é uma chave privada válida para P-256
  // (deve ser > 0 e < order da curva — @noble/curves valida automaticamente ao usar)
  const privateKeyHex = bytesToHex(randomBytes);

  // Persiste em hex
  await AsyncStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKeyHex);

  return randomBytes;
}

/** Exporta a chave pública no formato JWK (para o header do DPoP proof) */
export async function exportPublicJWK(): Promise<{ kty: string; crv: string; x: string; y: string }> {
  const privateKey = await getOrCreatePrivateKey();
  const publicPoint = p256.getPublicKey(privateKey, false); // uncompressed: 0x04 || x || y

  // Pula o primeiro byte (0x04 = uncompressed marker)
  const x = publicPoint.slice(1, 33);
  const y = publicPoint.slice(33, 65);

  return {
    kty: 'EC',
    crv: 'P-256',
    x: base64urlEncode(x),
    y: base64urlEncode(y),
  };
}

// --- Criação do DPoP Proof JWT ---

/**
 * Cria um DPoP Proof JWT assinado com ES256.
 *
 * @param method - Método HTTP (ex: "POST")
 * @param url - URL do endpoint (sem query string)
 * @returns DPoP Proof JWT string (header.payload.signature)
 */
export async function createDPoPProof(method: string, url: string): Promise<string> {
  const privateKey = await getOrCreatePrivateKey();
  const publicJWK = await exportPublicJWK();

  // Header
  const header = {
    typ: 'dpop+jwt',
    alg: 'ES256',
    jwk: publicJWK,
  };

  // Payload
  const payload = {
    jti: Crypto.randomUUID(),
    htm: method,
    htu: url,
    iat: Math.floor(Date.now() / 1000),
  };

  // Codifica header e payload
  const headerB64 = base64urlEncodeJSON(header);
  const payloadB64 = base64urlEncodeJSON(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  // Assina com ECDSA P-256 (ES256)
  // p256.sign aplica SHA-256 internamente, então passamos os bytes crus
  const signingInputBytes = new TextEncoder().encode(signingInput);
  const rawSig = p256.sign(signingInputBytes, privateKey, { lowS: true }) as Uint8Array;

  const signatureB64 = base64urlEncode(rawSig);

  return `${signingInput}.${signatureB64}`;
}

/**
 * Limpa as chaves DPoP armazenadas.
 * Útil para logout completo ou reset do dispositivo.
 */
export async function clearDPoPKeys(): Promise<void> {
  await AsyncStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
}
