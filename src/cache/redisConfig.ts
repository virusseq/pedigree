import { createClient } from 'redis';

import { config } from '@/config';

const client = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password,
});

export const connectRedis = (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    client.on('error', (err) => reject(new Error(`Redis Client Error: ${err}`)));

    if (!client.isOpen) {
      await client.connect();
    }

    return resolve();
  });
};

export const disconnectRedis = () => {
  if (!client.isOpen) {
    client.quit;
  }
};

export type keyFormat = `${string}:${string}`;

export const saveHash = async (key: keyFormat, value: Record<string, string | number>) => {
  return await client.hSet(key, [...Object.entries(value).flat()]);
};

export const getHash = async (key: keyFormat) => {
  return await client.hGetAll(key);
};
