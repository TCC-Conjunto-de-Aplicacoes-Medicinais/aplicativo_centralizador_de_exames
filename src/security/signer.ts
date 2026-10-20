import { Platform } from 'react-native';

// Web usa signer.web (sem simulação). Nativo (dev e produção) usa biometria do aparelho.
const signer =
  Platform.OS === 'web'
    ? require('./signer.web')
    : require('./signer.native');

export const createKeys = signer.createKeys;
export const sign = signer.sign;
export const authenticateUser = signer.authenticateUser;
