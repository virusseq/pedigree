import logger from '@/logger';
import { gsBucketName, gsFolderName } from '@/config';

import { listFiles, streamFileDownload } from './storage';
import { getNewestFile } from './utils';
import { getCache } from './cache';

export const startUpdateLineageScript = function (useCache: boolean) {
  logger.info(`startUpdateLineageScript useCache:${useCache}`);

  Promise.all([getCache(useCache), listFiles(gsBucketName, gsFolderName)])
    .then()
    .then((files: any) => getNewestFile(files[0]))
    .then((newFile) => {
      logger.debug('Newest File is:' + newFile.name);
      return newFile.name;
    })
    .then((file) => streamFileDownload(gsBucketName, file))
    .catch((err) => {
      console.error(err);
    });
};
