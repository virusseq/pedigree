import logger from '@/logger';
import { GetFilesResponse, Storage } from '@google-cloud/storage';
import { parse } from 'csv';
import { song_endpoint, gsBucketName, gsFolderName } from '@/config';
import axios from 'axios';
import { getNewestFile } from './utils';
import { Writable } from 'stream';

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

const handleData = new Writable({
  objectMode: true,
  write(chunk, _encoding, callback) {
    const { study_id, specimen_collector_sample_ID, lineage, scorpio_call } = chunk;

    logger.debug(`start processing id:${specimen_collector_sample_ID}`);

    // TODO: get from Cache AnalysisID by specimen_collector_sample_ID
    // TODO: IF analysisID not found in Cache get Study/Analysis and save in Cache
    // TODO: IF lineage Data mismatch then Update Record in Cache and Song

    // Comment out to stop Stream
    callback();
  },
});

function updateRecord(record: any) {
  logger.info(`calling ${song_endpoint} record:${record['specimen_collector_sample_ID']}`);

  let payload = {
    lineage: record['lineage'],
  };
  axios
    .post(song_endpoint, payload)
    .then((msg) =>
      logger.debug(
        `record:${record['specimen_collector_sample_ID']} status:${msg.status}, statusText:${
          msg.statusText
        }, data:${JSON.stringify(msg.data)}`,
      ),
    )
    .catch((err) => logger.error(`error:${err}`));
}
