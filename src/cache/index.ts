import logger from '../utils/logger';
import { connectRedis } from './redisConfig';
import { Analysis, getAllStudies, getAnalysisByStudyPaginated } from 'services/song';

export const startLoadCachePipeline = function (): Promise<void> {
  return new Promise(async (resolve, reject) => {
    connectRedis()
      .then(getAllStudies)
      .then(async (studies) =>
        Promise.all(studies.map((study) => getAndCacheAnalysisByStudy(study))),
      )
      .catch(reject);
  });
};

function getAndCacheAnalysisByStudy(studyId: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const limit: number = 9;
    let offset: number = 0;
    let total: number = limit;

    while (offset < total) {
      let resp = await getAnalysisByStudyPaginated(studyId, limit, offset);
      offset += resp.currentTotalAnalyses;
      total = resp.totalAnalyses;

      if (total > 0) {
        try {
          await saveCacheAnalysis(resp.analyses);
        } catch (error) {
          logger.error(error);
        }
      }
    }
    resolve(studyId);
  });
}

function saveCacheAnalysis(analysisList: Array<Analysis>): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    logger.debug(`caching ${analysisList?.length} analysis`);

    //TODO: cache analysis
    connectRedis()
      .then(async (c) => {
        for (const analysis of analysisList) {
          if (
            analysis.samples.at(0) != undefined &&
            analysis.samples.at(0)?.submitterSampleId != undefined
          ) {
            await c.hSet(
              'sample:' + analysis.samples.at(0)?.submitterSampleId,
              'analysisId',
              analysis.analysisId,
            );
          }
        }
      })
      .catch((error) => reject(error));

    resolve();
  });
}

export const getAnalysisIdBySpecimenCollectorSampleId = (id: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // TODO: get analysisId from cache

    resolve('');
  });
};
