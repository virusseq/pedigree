import logger from '@/logger';
import axios from 'axios';
import { song_endpoint } from '@/config';

const cache: Array<any> = [];

export const getCache = async function (useCache: boolean) {
  return new Promise<Array<any>>((resolve) => {
    if (useCache) {
      initCache()
    } else{
      resolve([])
    }
  });
}

export const initCache = function () {
  getStudies()
    .then(getAnalysisByStudy)
    .then(saveCacheAnalysis)
    .then((res: any) => logger.debug('Script completed'))
    .catch((err: any) => logger.error(`error:${err}`));
};

function getStudies() {
  return new Promise<String[]>((resolve, reject) => {
    return axios
      .get(`${song_endpoint}/studies/all`)
      .then((resp) => {
        logger.debug(`found ${resp.data?.length} studies`);
        resolve(resp.data);
      })
      .catch((err) => reject(err));
  });
}

function getAnalysisByStudy(studies: String[]) {
  const analysisState: string = 'PUBLISHED';
  const limit: number = 100;
  const offset: number = 0;

  // test
  const studyId: string = 'KHSC-ON';

  logger.info(`getAnalysisByStudy - fetching analysis for study:${studyId}`);

  const fullEndpoint = `${song_endpoint}/studies/${studyId}/analysis/paginated?analysisStates=${analysisState}&limit=${limit}&offset=${offset}`;

  return new Promise((resolve, reject) => {
    return axios
      .get(fullEndpoint)
      .then((resp) => {
        logger.debug(`found ${resp?.data?.analyses?.length} analysis`);
        resolve(resp.data?.analyses);
      })
      .catch((err) => reject(err));
  });
}

function saveCacheAnalysis(analysis: any) {
  return new Promise((resolve, reject) => {
    logger.info(`caching ${analysis?.length} analysis`);

    //TODO: cache analysis

    resolve(analysis);
  });
}
