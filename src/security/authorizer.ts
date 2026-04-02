import { createKeys } from './signer';
import { getDevice } from './device';

export const createAuthorizer = async () => {
  const { publicKey } = await createKeys();
  const device = await getDevice();

  return {
    publicKey,
    device,
  };
};