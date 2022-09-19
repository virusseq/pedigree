import logger from '@/logger';
// Imports the Google Cloud client library
import { Storage } from '@google-cloud/storage';

const fs = require('fs');
const path = require('path');

const cwd = path.join(__dirname, '..');
const destFileName = path.join(cwd, 'downloaded.txt');

// Creates a client
const storage = new Storage();

export const streamFileDownload = async function (bucketName: string, fileName: string) {
  // The example below demonstrates how we can reference a remote file, then
  // pipe its contents to a local file.
  // Once the stream is created, the data can be piped anywhere (process, sdout, etc)
  await storage
    .bucket(bucketName)
    .file(fileName)
    .createReadStream() //stream is created
    .pipe(fs.createWriteStream(destFileName))
    .on('finish', () => {
      // The file download is complete
      logger.debug(`gs://${bucketName}/${fileName} downloaded to ${destFileName}.`);
    });
};

export const listFiles = async function (bucketName: string, folderName: string) {

    const options = {
        prefix: folderName || "",
        autoPaginate: false,
        delimiter: "/"
    };

  // Lists files in the bucket
  logger.debug(`List files on bucket ${bucketName} folder:${folderName}`);
  return storage.bucket(bucketName).getFiles(options);
};
