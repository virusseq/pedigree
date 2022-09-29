import logger from '@/logger';
import axios from 'axios';
import { song_endpoint } from '@/config';

export const initCache = function (): Promise<void> {
  return getStudies().then(getAnalysisByStudy).then(saveCacheAnalysis);
};

function getStudies(): Promise<String[]> {
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

function getAnalysisByStudy(studies: String[]): Promise<Array<Object>> {
  const analysisState: string = 'PUBLISHED';
  const limit: number = 100;
  const offset: number = 0;

  // test
  const studyId: string = 'KHSC-ON';

  logger.info(`getAnalysisByStudy - fetching analysis for study:${studyId}`);

  const fullEndpoint = `${song_endpoint}/studies/${studyId}/analysis/paginated?analysisStates=${analysisState}&limit=${limit}&offset=${offset}`;

  return new Promise<Array<Object>>((resolve, reject) => {
    return axios
      .get(fullEndpoint)
      .then((resp) => {
        logger.debug(`found ${resp?.data?.analyses?.length} analysis`);
        resolve(resp.data?.analyses);
      })
      .catch((err) => reject(err));
  });
}

function saveCacheAnalysis(analysis: Array<Object>): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    logger.info(`caching ${analysis?.length} analysis`);

    //TODO: cache analysis

    resolve();
  });
}
