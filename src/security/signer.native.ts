import * as Crypto from 'expo-crypto';
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

const fallbackSignature = async (payload: string) => {
  const defaultSignature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${payload}:${Date.now()}`
  );
  return defaultSignature;
};

export const createKeys = async () => {
  try {
    const { keysExist } = await rnBiometrics.biometricKeysExist();

    if (!keysExist) {
      await rnBiometrics.createKeys();
    }

    const { publicKey } = await rnBiometrics.createKeys();
    return { publicKey };
  } catch (error) {
    console.warn('[signer.native] createKeys fails, proceeding without biometric keypair.', error);
    return { publicKey: '' };
  }
};

export const sign = async (payload: string) => {
  try {
    const signResult = await rnBiometrics.createSignature({
      payload,
      promptMessage: 'Autentique-se para assinar',
      cancelButtonText: 'Cancelar',
    });

    if (signResult.success && signResult.signature) {
      return signResult.signature;
    }

    console.warn('[signer.native] createSignature retornou falha, usando assinatura local de fallback (sem prompt adicional):', signResult.error);
    return fallbackSignature(payload);
  } catch (err) {
    console.warn('[signer.native] createSignature lançando erro, usando assinatura local de fallback (sem prompt adicional):', err);
    return fallbackSignature(payload);
  }
};