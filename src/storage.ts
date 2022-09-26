import logger from '@/logger';
import { Storage } from '@google-cloud/storage';
import { parse, transform } from 'csv';
import { tsvColumnNames, song_endpoint } from '@/config';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

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
      storage.bucket(bucketName).file(fileName).createReadStream() //stream is created
        .pipe(
          parse({
            delimiter: '\t',
            columns: true,
            trim: true,
          }),
        )
        .pipe(transform(handleData))
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

function handleData(row: any) {
  // Async call
  updateRecord(row);

  // Transform data
  return tsvColumnNames
    .map((name: string) => row[name.trim()])
    .join('\t')
    .concat('\n');
}

function updateRecord(record: any) {
  logger.info(`calling ${song_endpoint} record:${record['specimen_collector_sample_ID']}`);

  let payload = {
    lineage: record['lineage'],
  };
  axios
    .post(song_endpoint, payload)
    .then((msg) =>
      logger.debug(
        `record:${record['specimen_collector_sample_ID']} status:${msg.status}, statusText:${msg.statusText}, data:${JSON.stringify(msg.data)}`,
      ),
    )
    .catch((err) => logger.error(`error:${err}`));
}
