import * as Crypto from 'expo-crypto';

export const createKeys = async () => {
  // ⚠️ Simulação (não seguro)
  const fakePrivateKey = 'dev-private-key';

  const publicKey = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    fakePrivateKey
  );

  return {
    publicKey,
  };
};

export const sign = async (payload: string) => {
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload
  );

  return signature;
};