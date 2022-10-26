export const debug = process.env.DEBUG === 'true';
export const gsBucketName = process.env.GS_BUCKET_NAME || '';
export const gsFolderName = process.env.GS_FOLDER || '';
export const song_endpoint = process.env.SONG_ENDPOINT || '';
export const authEgoClientId = process.env.EGO_CLIENT_ID || '';
export const authEgoClientSecret = process.env.EGO_CLIENT_SECRET || '';
export const authEgoUrl = process.env.EGO_URL || '';
export const authJwtKey = process.env.JWT_KEY || '';
export const authJwtKeyUrl = process.env.JWT_KEY_URL || '';
export const vaultEnabled = process.env.VAULT_ENABLED === 'true'
export const authEnabled = process.env.VAULT_ENABLED !== 'false' // true unless set to 'false'
export const redisHost = process.env.REDIS_HOST || 'localhost';
export const redisPort = parseInt(process.env.REDIS_PORT || '6379');
export const redisPassword = process.env.REDIS_PASSWORD || '';
export const analysisTypeVersion = parseInt(process.env.ANALYSIS_TYPE_VERSION || '1');