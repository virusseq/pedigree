import logger from '../utils/logger';
import { connectRedis } from './redisConfig';
import { Analysis, getAllStudies, getAnalysisByStudyPaginated } from 'services/song';

export const startLoadCachePipeline = function (): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    connectRedis()
      .then(getAllStudies)
      .then(async (studies) =>
        Promise.all(
          studies
            .filter((study) => study === 'UHTC-ON') // filtering by study only for testing purpose
            .map((study) => getAndCacheAnalysisByStudy(study)),
        ).then((resp) => resolve()),
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
      .then(async (c) => {
        logger.debug(`saveCacheAnalysis - start caching ${analysisList?.length} analysis`);
        for (const analysis of analysisList) {
          if (
            analysis.samples.at(0) != undefined &&
            analysis.samples.at(0)?.submitterSampleId != undefined
          ) {
            await c.hSet(
              `sample:${analysis.samples.at(0)?.submitterSampleId}`,
              'analysisId',
              analysis.analysisId,
            );
          }
        }
        logger.debug(`saveCacheAnalysis - finished caching ${analysisList?.length} analysis`);
        resolve();
      })
      .catch((error) => reject(error));
  });
}

export const getAnalysisIdBySpecimenCollectorSampleId = (analysisId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    connectRedis()
      .then(async (c) => {
        let cachedData = await c.hGetAll(`sample:${analysisId}`);
        resolve(cachedData.analysisId);
      })
      .catch((error) => reject(error));
  });
};
