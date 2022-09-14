export const debug = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
export const podName = process.env.HOSTNAME || '';
