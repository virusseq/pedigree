import { GetFilesResponse, Storage } from '@google-cloud/storage';
import { parse } from 'csv';

import { gsBucketName, gsFolderName } from '../config';
import { getNewestFile, getFileName } from '../utils/utils';
import logger from '../utils/logger';
import { Writable } from 'stream';
import { resolve } from 'path';

// Creates a client
const storage = new Storage();

export const getLatestViralAIFile = (): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    listFiles(gsBucketName, gsFolderName)
      .then((files: GetFilesResponse) => getNewestFile(files[0]))
      .then(getFileName)
      .then((resp) => resolve(resp))
      .catch(reject);
  });
};

export const streamFileDownload = (fileName: string, handleData: Writable): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    logger.info(`Downloading file:${fileName}`);
    storage
      .bucket(gsBucketName)
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
        logger.info(`gs://${gsBucketName}/${fileName} download completed`);
        resolve(`gs://${gsBucketName}/${fileName} download completed`);
      })
      .on('error', () => {
        // The file download is complete
        logger.error(`gs://${gsBucketName}/${fileName} download failed`);
        reject(`gs://${gsBucketName}/${fileName} download failed`);
      });
  });
};

const listFiles = async function (
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
