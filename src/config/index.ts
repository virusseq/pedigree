export const config = {
  server: {
    debug: process.env.DEBUG === 'true',
    apiRetries: parseInt(process.env.API_RETRIES || '3'),
    apiTimeout: parseInt(process.env.API_TIMEOUT || '10000'),
    timezone: process.env.TIMEZONE || 'America/Toronto',
  },
  gs: {
    bucket: process.env.GS_BUCKET_NAME || '',
    folder: process.env.GS_FOLDER || '',
  },
  song: {
    endpoint: process.env.SONG_ENDPOINT || '',
  },
  ego: {
    clientId: process.env.EGO_CLIENT_ID || '',
    clientSecret: process.env.EGO_CLIENT_SECRET || '',
    url: process.env.EGO_URL || '',
  },
  jwt: {
    key: process.env.JWT_KEY || '',
    url: process.env.JWT_KEY_URL || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
  },
  analysis: {
    typeVersion: parseInt(process.env.ANALYSIS_TYPE_VERSION || '1'),
  },
  notifications: {
    slack_url: process.env.NOTIFICATIONS_SLACK_URL || '',
  },
};
