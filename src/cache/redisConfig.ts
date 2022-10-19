import logger from '@/utils/logger';
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

export function connectRedis(): Promise<RedisClient> {
  return new Promise(async (resolve, reject) => {
    client.on('error', (err) => reject('Redis Client Error:' + err));

    if (!client.isOpen) {
      logger.debug(`connect redis`);
      await client.connect();
    }

    return resolve(client);
  });
}

export function disconnectRedis() {
  if (!client.isOpen) {
    logger.info(`quitting redis`);
    client.quit;
  }
}
