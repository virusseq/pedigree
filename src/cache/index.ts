import logger from '../utils/logger';
import { connectRedis, saveHash, getHash } from './redisConfig';
import { Analysis, getAllStudies, getAnalysisByStudyPaginated } from 'services/song';

export type CacheData = {
  analysisId: string;
  analysisTypeVersion: number;
  lineageName: string;
  lineageAnalysisSoftwareName: string;
  lineageAnalysisSoftwareVersion: string;
  scorpioCall: string;
  scorpioVersion: string;
};

export const startLoadCachePipeline = function (): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    connectRedis() // verify redis connection at start
      .then(getAllStudies)
      .then(async (studies) =>
        Promise.all(studies.map((study) => getAndCacheAnalysisByStudy(study))).then((resp) =>
          resolve(),
        ),
      )
      .catch(reject);
  });
};

function getAndCacheAnalysisByStudy(studyId: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const limit: number = 100;
    let offset: number = 0;
    let total: number = limit;

    while (offset < total) {
      let resp = await getAnalysisByStudyPaginated(studyId, limit, offset);
      offset += resp.currentTotalAnalyses;
      total = resp.totalAnalyses;

      if (total > 0) {
        try {
          await saveCacheAnalysis(resp.analyses);
          logger.info(`progress ${studyId} cached ${offset} of ${total}`);
        } catch (error) {
          logger.error(`Error on saveCacheAnalysis: ${error}`);
        }
      }
    }
    logger.info(`finished caching ${studyId} total of ${total} records`);
    resolve(studyId);
  });
}

function saveCacheAnalysis(analysisList: Array<Analysis>): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    connectRedis()
      .then(async () => {
        logger.debug(`saveCacheAnalysis - start caching ${analysisList?.length} analysis`);
        for (const analysis of analysisList) {
          if (analysis.samples.at(0)?.submitterSampleId != null) {
            const hsetData: CacheData = {
              analysisId: analysis.analysisId,
              analysisTypeVersion: analysis.analysisType.version,
              lineageName: analysis.lineage_analysis.lineage_name || '',
              lineageAnalysisSoftwareName: analysis.lineage_analysis.lineage_analysis_software_name || '',
              lineageAnalysisSoftwareVersion: analysis.lineage_analysis.lineage_analysis_software_version || '',
              scorpioCall: analysis.lineage_analysis.scorpio_call || '',
              scorpioVersion: analysis.lineage_analysis.scorpio_version || ''
            };

            await saveHash(`sample:${analysis.samples.at(0)?.submitterSampleId}`, hsetData);
          }
        }
        logger.debug(`saveCacheAnalysis - finished caching ${analysisList?.length} analysis`);
        resolve();
      })
      .catch((error) => reject(error));
  });
}

export const getCacheByKey = (key: string): Promise<CacheData> => {
  return new Promise((resolve, reject) => {
    connectRedis()
      .then(async () => {
        let cachedData = await getHash(key);
        if (Object.keys(cachedData).length == 0) {
          reject(`key:${key} not found in cache.`);
        }
        resolve(toCacheData(cachedData));
      })
      .catch((error) => reject(error));
  });
};

function toCacheData(data: any): CacheData {
  let cacheData: CacheData = {
    analysisId: data['analysisId'],
    analysisTypeVersion: data['analysisTypeVersion'],
    lineageName: data['lineageName'],
    lineageAnalysisSoftwareName: data['lineageAnalysisSoftwareName'],
    lineageAnalysisSoftwareVersion: data['lineageAnalysisSoftwareVersion'],
    scorpioCall: data['scorpioCall'],
    scorpioVersion: data['scorpioVersion'],
  };

  return cacheData;
}
