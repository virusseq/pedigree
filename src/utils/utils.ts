import { File } from '@google-cloud/storage';

import logger from './logger';

export const getNewestFile = async function (files: Array<File>) {
  // Get only the newest file by timeCreated
  logger.debug('files length:' + files.length);
  return files.reduce(
    (prevFile: any, currFile: any) =>
      prevFile && prevFile.metadata.timeCreated >= currFile.metadata.timeCreated
        ? prevFile
        : currFile,
    null,
  );
};
