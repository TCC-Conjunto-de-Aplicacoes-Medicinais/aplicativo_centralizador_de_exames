// Web (PWA): a confirmação de ações usa passkey (src/services/passkey.ts), não este signer.
// Estas operações de biometria nativa falham com mensagem clara em vez de simular.
const UNSUPPORTED = 'Assinatura e biometria ainda indisponíveis na versão web. Use o aplicativo instalado.';

export const createKeys = async () => {
  throw new Error(UNSUPPORTED);
};

export const sign = async (_payload: string): Promise<string> => {
  throw new Error(UNSUPPORTED);
};

export const authenticateUser = async (_promptMessage: string): Promise<boolean> => {
  throw new Error(UNSUPPORTED);
};
