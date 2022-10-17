import { Writable } from 'stream';

import logger from '../utils/logger';
import { getAnalysisIdBySpecimenCollectorSampleId } from '../cache';
import { patchAnalysis } from '../services/song';
import { getLatestViralAIFileName, streamFileDownload } from './viralAI';

export const startUpdateAnalysisPipeline = function (): Promise<void> {
  return new Promise<void>(() => {
    getLatestViralAIFileName().then((fileName: string) => streamFileDownload(fileName, handleData));
  });
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

      patchAnalysis(study_id, analysisId, data);

      // Comment out to stop Stream
      // callback();
    });
  },
});
