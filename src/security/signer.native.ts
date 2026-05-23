import * as Crypto from 'expo-crypto';
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

const fallbackSignature = async (payload: string) => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload
  );
};

export const createKeys = async () => {
  try {
    const { keysExist } = await rnBiometrics.biometricKeysExist();

    if (!keysExist) {
      return await rnBiometrics.createKeys();
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
    const promptResult = await rnBiometrics.simplePrompt({
      promptMessage: 'Autentique-se para assinar',
      cancelButtonText: 'Cancelar',
    });

    if (promptResult.success) {
      return fallbackSignature(payload);
    }

    throw new Error('Autenticação cancelada.');
  } catch (err) {
    console.warn('[signer.native] simplePrompt falhou:', err);
    throw err;
  }
};

export const authenticateUser = async (promptMessage: string): Promise<boolean> => {
  try {
    const promptResult = await rnBiometrics.simplePrompt({
      promptMessage: promptMessage,
      cancelButtonText: 'Cancelar',
    });
    return promptResult.success;
  } catch (err) {
    console.warn('[signer.native] authenticateUser falhou ou cancelado:', err);
    return false;
  }
};