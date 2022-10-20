import { createClient } from 'redis';
import { redisHost, redisPort, redisPassword } from '../config';

type RedisClient = ReturnType<typeof createClient>;

const client = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
  },
  password: redisPassword,
});

export const connectRedis = (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    client.on('error', (err) => reject('Redis Client Error:' + err));

    if (!client.isOpen) {
      await client.connect();
    }

    return resolve();
  });
}

export const disconnectRedis = () => {
  if (!client.isOpen) {
    client.quit;
  }
}

export const saveHash = async (key: string, value: Record<string, string | number>) => {
  return await client.hSet(key, [
    ...Object.entries(value).flat(),
  ]);
}

export const getHash = async (key: string) => {
  return await client.hGetAll(key);
}