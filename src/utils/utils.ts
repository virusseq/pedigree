import { File } from '@google-cloud/storage';

import logger from './logger';

export const getNewestFile = (files: Array<File>): Promise<File> => {
  return new Promise<File>((resolve) => {
    // Get only the newest file by timeCreated
    logger.debug('files length:' + files.length);
    let newestFile: File = files.reduce(
      (prevFile: any, currFile: any) =>
        prevFile && prevFile.metadata.timeCreated >= currFile.metadata.timeCreated
          ? prevFile
          : currFile,
      null,
    );
    resolve(newestFile);
  });
};

export const getFileName = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    logger.debug(`newest file is ${file.name} ${file.metadata.timeCreated}`);
    resolve(file.name);
  })
}
