require('dotenv').config({
  debug: process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true',
});

import logger from '@/logger';
import { gsBucketName, gsFolderName } from '@/config';
import { listFiles, streamFileDownload } from './storage';
import { getNewestFile } from './utils';

/**
 * Main Function - All work done here
 */
async function runScript() {
  listFiles(gsBucketName, gsFolderName)
    .then((files) => getNewestFile(files[0]))
    .then((newFile) => {
      logger.debug('Newest File is:' + newFile.name);
      return newFile.name;
    })
    .then((file) => streamFileDownload(gsBucketName, file))
    .catch((err) => {
      console.error(err);
    });
}

/**
 * RUN SCRIPT
 */
runScript();
