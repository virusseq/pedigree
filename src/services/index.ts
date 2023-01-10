import { Writable } from 'stream';

import logger from '@/utils/logger';
import { config } from '@/config';
import { getCacheByKey, CacheData, hashKeyFormatter } from '@/cache';
import { Analysis, patchAnalysis } from '@/services/song';

import { getLatestViralAIFile, streamFileDownload, TsvColumns } from './viralAI';

const lineageSoftwareName = 'pangolin';

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
    getCacheByKey(hashKeyFormatter(source.study_id, source.specimen_collector_sample_ID))
      .then(async (cache: CacheData) => {
        if (isValidData(source, cache)) {
          const payload: Partial<Analysis> = {
            lineage_analysis: {
              lineage_name: source.lineage,
              lineage_analysis_software_name: lineageSoftwareName,
              lineage_analysis_software_version: source.pangolin_version,
              lineage_analysis_software_data_version: source.pangolin_data_version,
              scorpio_call: source.scorpio_call,
              scorpio_version: source.scorpio_version,
            },
          };
          await patchAnalysis(source.study_id, cache.analysisId, payload);
        }

        callback();
      })
      .catch((err) => {
        logger.error(
          `An error occurred with ${source.study_id}:${source.specimen_collector_sample_ID}. ${err}`,
        );
        callback();
      });
  },
});

function isValidData(source: TsvColumns, cache: CacheData): boolean {
  if (cache.lineageName == source.lineage) {
    logger.debug(`No changes for analysisId:${cache.analysisId} onlineage prop. skipping..`);
    return false;
  } else if (cache.analysisTypeVersion != config.analysis.typeVersion) {
    logger.error(
      `AnalysisId:${cache.analysisId} with analysisTypeVersion(${cache.analysisTypeVersion}) not supported. Must be version:${config.analysis.typeVersion}`,
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
