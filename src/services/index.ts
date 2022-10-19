import { Writable } from 'stream';

import logger from '../utils/logger';
import * as config from '../config';
import { getCacheByKey, CacheData } from '../cache';
import { patchAnalysis } from '../services/song';
import { getLatestViralAIFile, streamFileDownload } from './viralAI';

export const startUpdateAnalysisPipeline = function (): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    getLatestViralAIFile()
      .then((fileName: string) => streamFileDownload(fileName, handleData))
      .then(() => resolve('finish'))
      .catch(reject);
  });
};

export const handleData = new Writable({
  objectMode: true,
  write(chunk, _encoding, callback) {
    const {
      study_id: sourceStudyId,
      specimen_collector_sample_ID: sourceSpecimentCSampleId,
      lineage: sourceLineage,
    } = chunk;

    getCacheByKey(`sample:${sourceSpecimentCSampleId}`)
      .then(async (cache: CacheData) => {
        if (cache.lineage == sourceLineage) {
          logger.info(`No changes for analysisId:${cache.analysisId} onlineage prop. skipping..`);
        } else if (cache.analysisTypeVersion != config.analysisTypeVersion) {
          logger.info(
            `AnalysisId:${cache.analysisId} with analysisTypeVersion(${cache.analysisTypeVersion}) not supported. Must be version:${config.analysisTypeVersion}`,
          );
        } else if (!cache.analysisId && !sourceLineage) {
          const data = {
            sourceLineage,
          };
          logger.debug(
            `got analysisId from cache:${cache.analysisId} with key:${sourceSpecimentCSampleId}`,
          );
        } else {
          logger.error(`unexpected error on sampleId:${sourceSpecimentCSampleId}`);
        }
        // await patchAnalysis(study_id, cachedAnalyisId.toString(), data);

        callback();
      })
      .catch(() => {
        logger.error(`specimen_collector_sample_ID:${sourceSpecimentCSampleId} not found in cache`);
        callback();
      });
  },
});
