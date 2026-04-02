import { sign } from './signer';

export const secureRequest = async (url: string, options: any = {}) => {
  const payload = `${options.method || 'GET'} ${url} ${Date.now()}`;

  const signature = await sign(payload);

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'x-payload': payload,
      'x-signature': signature,
    },
  });

  return res.json();
};