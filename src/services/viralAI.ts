import { GetFilesResponse, Storage } from '@google-cloud/storage';
import { parse } from 'csv';

import { config } from '../config';
import { getNewestFile, getFileName } from '../utils/utils';
import logger from '../utils/logger';
import { Writable } from 'stream';

// Creates a client
const storage = new Storage();

export type TsvColumns = {
  fasta_header_name: string;
  study_id: string;
  specimen_collector_sample_ID: string;
  consensus_sequence_software_name: string;
  consensus_sequence_software_version: string;
  breadth_of_coverage_value: string;
  depth_of_coverage_value: string;
  reference_genome_accession: string;
  lineage: string;
  scorpio_call: string;
  pangolin_data_version: string;
  pangolin_version: string;
  scorpio_version: string;
};

export const getLatestViralAIFile = (): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    listFiles(config.gs.bucket, config.gs.folder)
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
      .bucket(config.gs.bucket)
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
        logger.info(`gs://${config.gs.bucket}/${fileName} download completed`);
        resolve(`gs://${config.gs.bucket}/${fileName} download completed`);
      })
      .on('error', () => {
        // The file download is complete
        logger.error(`gs://${config.gs.bucket}/${fileName} download failed`);
        reject(`gs://${config.gs.bucket}/${fileName} download failed`);
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
