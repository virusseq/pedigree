import { GetFilesResponse, Storage } from '@google-cloud/storage';
import { parse } from 'csv';

import { gsBucketName, gsFolderName } from './config';
import { getNewestFile } from './utils';
import logger from './logger';
import { handleData } from './lineage';

// Creates a client
const storage = new Storage();

export const pipelineSource = function (): Promise<void> {
  return new Promise<void>(() => {
    listFiles(gsBucketName, gsFolderName)
      .then((files: GetFilesResponse) => getNewestFile(files[0]))
      .then((newFile) => {
        logger.debug('Newest File is:' + newFile.name);
        return newFile.name;
      })
      .then((fileName: string) => streamFileDownload(gsBucketName, fileName));
  });
};

export const streamFileDownload = async function (
  bucketName: string,
  fileName: string,
): Promise<void> {
  logger.info(`Downloading file:${fileName}`);
  storage
    .bucket(bucketName)
    .file(fileName)
    .createReadStream() //stream is created
    .pipe(
      parse({
        delimiter: '\t',
        columns: true,
        trim: true,
      }),
    )
    .pipe(handleData)
    .on('finish', () => {
      // The file download is complete
      logger.info(`gs://${bucketName}/${fileName} download completed`);
    });
};

export const listFiles = async function (
  bucketName: string,
  folderName: string,
): Promise<GetFilesResponse> {
  const options = {
    prefix: folderName || '',
    autoPaginate: false,
    delimiter: '/',
  };

  // Lists files in the bucket
  logger.debug(`List files on bucket ${bucketName} folder:${folderName}`);
  return storage.bucket(bucketName).getFiles(options);
};
