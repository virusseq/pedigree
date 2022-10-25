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
        if (isValidData(source, cache)) {
          const payload = {
            lineage_analysis: {
              lineage_name: source.lineage,
              lineage_analysis_software_name: 'pangolin',
            },
          };
          await patchAnalysis(source.study_id, cache.analysisId, payload);
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

function isValidData(source: TsvColumns, cache: CacheData): boolean {
  if (cache.lineage == source.lineage) {
    logger.info(`No changes for analysisId:${cache.analysisId} onlineage prop. skipping..`);
    return false;
  } else if (cache.analysisTypeVersion != config.analysisTypeVersion) {
    logger.info(
      `AnalysisId:${cache.analysisId} with analysisTypeVersion(${cache.analysisTypeVersion}) not supported. Must be version:${config.analysisTypeVersion}`,
    );
    return false;
  } else if (!cache?.analysisId || !source?.lineage) {
    logger.error(
      `Invalid Cache or Source data. AnalysisId:${cache?.analysisId} lineage:${!source?.lineage}`,
    );
    return false;
  }

  return true;
}
