import axios from 'axios';
import { Writable } from 'stream';

import logger from './logger';
import { pipelineSource } from './storage';
import { initCache } from './cache';
import { getEgoToken } from './ego';
import { song_endpoint } from './config';
import { getAnalysisIdBySpecimenCollectorSampleId } from './cache';

export const startUpdateLineageScript = function (useCache: boolean) {
  logger.info(`startUpdateLineageScript useCache:${useCache}`);

  if (!useCache) {
    initCache().then(pipelineSource);
  } else {
    pipelineSource();
  }
};

export const handleData = new Writable({
  objectMode: true,
  write(chunk, _encoding, callback) {
    const { study_id, specimen_collector_sample_ID, lineage } = chunk;

    logger.debug(`start processing id:${specimen_collector_sample_ID}`);

    getAnalysisIdBySpecimenCollectorSampleId(specimen_collector_sample_ID).then((analysisId) => {
      const data = {
        lineage,
      };

      updateRecord(study_id, analysisId, data);

      // Comment out to stop Stream
      // callback();
    });
  },
});

function updateRecord(studyId: string, analysisId: string, data: any): Promise<String> {
  return new Promise<String>(async (resolve, reject) => {
    const fullUrl = `${song_endpoint}/studies/${studyId}/analysis/${analysisId}`;

    logger.debug(`calling PUT ${fullUrl}`);

    return axios
      .put(fullUrl, data, {
        headers: {
          Authorization: `Bearer ${await getEgoToken()}`,
        },
      })
      .then((msg) => {
        logger.debug(
          `analysisId:${analysisId} status:${msg.status} statusText:${
            msg.statusText
          } data:${JSON.stringify(msg.data)}`,
        );
        resolve('OK');
      })
      .catch((err) => reject(err));
  });
}
