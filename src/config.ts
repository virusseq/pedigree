export const debug = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
export const podName = process.env.HOSTNAME || '';
export const gsBucketName = process.env.GS_BUCKET_NAME || '';
export const gsFolderName = process.env.GS_FOLDER || '';
export const tsvColumnNames = process.env.TSV_ALLOWED_COLUMN_NAMES?.split(",") || ['']
export const song_endpoint = process.env.SONG_ENDPOINT || '';