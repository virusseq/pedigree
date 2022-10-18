import { Writable } from 'stream';

import logger from '../utils/logger';
import { getAnalysisIdBySpecimenCollectorSampleId } from '../cache';
import { patchAnalysis } from '../services/song';
import { getLatestViralAIFile, streamFileDownload } from './viralAI';

export const startUpdateAnalysisPipeline = function (): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    getLatestViralAIFile()
      .then((fileName: string) => streamFileDownload(fileName, handleData))
      .then(() => resolve("finish"))
      .catch(reject);
  });
};

export const handleData = new Writable({
  objectMode: true,
  write(chunk, _encoding, callback) {
    const { study_id, specimen_collector_sample_ID, lineage } = chunk;

    getAnalysisIdBySpecimenCollectorSampleId(specimen_collector_sample_ID).then(async (analysisId: string) => {

      if(analysisId != null) {
        const data = {
          lineage,
        };
        logger.debug(`got analysisId from cache:${analysisId} with key:${specimen_collector_sample_ID}`);
        await patchAnalysis(study_id, analysisId, data);
      } else {
        logger.error(`specimen_collector_sample_ID:${specimen_collector_sample_ID} not found in cache`)
      }

      callback();
    });
  },
});
