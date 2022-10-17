import { GetFilesResponse, Storage } from '@google-cloud/storage';
import { parse } from 'csv';

import { gsBucketName, gsFolderName } from '../config';
import { getNewestFile } from '../utils/utils';
import logger from '../utils/logger';
import { Writable } from 'stream';

// Creates a client
const storage = new Storage();

export const getLatestViralAIFileName = function (): Promise<string> {
  return new Promise<string>(() => {
    listFiles(gsBucketName, gsFolderName).then((files: GetFilesResponse) =>
      getNewestFile(files[0]),
    );
  });
};

export const streamFileDownload = async function (
  fileName: string,
  handleData: Writable,
): Promise<void> {
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
