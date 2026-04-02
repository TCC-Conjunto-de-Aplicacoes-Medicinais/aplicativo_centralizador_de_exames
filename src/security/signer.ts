import { Platform } from 'react-native';

// automatic import of the correct signer implementation based on the platform
const signer =
  Platform.OS === 'web' || __DEV__
    ? require('./signer.dev')
    : require('./signer.native');

export const createKeys = signer.createKeys;
export const sign = signer.sign;