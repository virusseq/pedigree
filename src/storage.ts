import logger from '@/logger';
import { Storage } from '@google-cloud/storage';
import { parse, transform } from 'csv';
import { tsvColumnNames } from '@/config';
import fs from 'fs';
import path from 'path';

// Creates a client
const storage = new Storage();

// Project root path
const cwd = path.join(__dirname, '..');

export const streamFileDownload = async function (bucketName: string, fileName: string) {
  const destFileName = path.join(cwd, fileName.split('/').pop()?.replaceAll(':', '_') || '');

  // Check if the file exists in the current directory.
  fs.access(destFileName, fs.constants.F_OK, (err) => {
    if (err) {
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
        .pipe(
          transform((record) =>
            tsvColumnNames
              .map((name: string) => record[name.trim()])
              .join('\t')
              .concat('\n'),
          ),
        )
        .pipe(fs.createWriteStream(destFileName))
        .on('finish', () => {
          // The file download is complete
          logger.info(`gs://${bucketName}/${fileName} downloaded to ${destFileName}.`);
        });

      return;
    }

    //file exists
    logger.info(`file:${destFileName} already exist`);
  });
};

export const listFiles = async function (bucketName: string, folderName: string) {
  const options = {
    prefix: folderName || '',
    autoPaginate: false,
    delimiter: '/',
  };

  // Lists files in the bucket
  logger.debug(`List files on bucket ${bucketName} folder:${folderName}`);
  return storage.bucket(bucketName).getFiles(options);
};
