import { Writable } from 'stream';

import logger from '../utils/logger';
import * as config from '../config';
import { getCacheByKey, CacheData } from '../cache';
import { patchAnalysis } from '../services/song';
import { getLatestViralAIFile, streamFileDownload, TsvColumns } from './viralAI';

export const startUpdateAnalysisPipeline = function (): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    getLatestViralAIFile()
      .then((fileName: string) => streamFileDownload(fileName, handleData))
      .then(() => resolve())
      .catch(reject);
  });
};

export const handleData = new Writable({
  objectMode: true,
  write(source: TsvColumns, _encoding, callback) {

    getCacheByKey(`sample:${source.specimen_collector_sample_ID}`)
      .then(async (cache: CacheData) => {
        if (cache.lineage == source.lineage) {
          logger.info(`No changes for analysisId:${cache.analysisId} onlineage prop. skipping..`);
        } else if (cache.analysisTypeVersion != config.analysisTypeVersion) {
          logger.info(
            `AnalysisId:${cache.analysisId} with analysisTypeVersion(${cache.analysisTypeVersion}) not supported. Must be version:${config.analysisTypeVersion}`,
          );
        } else if (cache.analysisId && source.lineage) {
          const payload = {
            lineage: source.lineage,
          };
          await patchAnalysis(source.study_id, cache.analysisId, payload);
        } else {
          logger.error(`unexpected error on sampleId:${source.specimen_collector_sample_ID}`);
        }

        callback();
      })
      .catch((err) => {
        logger.error(
          `An error occurred with specimen_collector_sample_ID:${source.specimen_collector_sample_ID}. ${err}`,
        );
        callback();
      });
  },
});
