import axios from 'axios';
import urlJoin from 'url-join';

import logger from '../utils/logger';
import { song_endpoint } from '../config';
import { getEgoToken } from '../security/ego';

export type GetAnalysesForStudyResponse = {
  analyses: Array<Analysis>;
  totalAnalyses: number;
  currentTotalAnalyses: number;
};

export type AnalysisType = {
  name: string;
  version: number;
};

export type Sample = {
  submitterSampleId: string;
};

export type Analysis = {
  analysisId: string;
  studyId: string;
  analysisType: AnalysisType;
  samples: Array<Sample>;
  lineage: string;
};

export function getAllStudies(): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const fullUrl = urlJoin(song_endpoint, '/studies/all');
    return axios
      .get(fullUrl)
      .then((resp) => {
        logger.info(`found ${resp.data?.length} studies`);
        resolve(resp.data);
      })
      .catch((err) => reject(err));
  });
}

export function getAnalysisByStudyPaginated(
  studyId: string,
  limit: number,
  offset: number,
): Promise<GetAnalysesForStudyResponse> {
  const analysisState: string = 'PUBLISHED';

  logger.debug(
    `getAnalysisByStudyPaginated - fetching analysis for study:${studyId} limit:${limit} offset:${offset}`,
  );

  const fullUrl = urlJoin(
    song_endpoint,
    `/studies/${studyId}/analysis/paginated?analysisStates=${analysisState}&limit=${limit}&offset=${offset}`,
  );

  return new Promise<GetAnalysesForStudyResponse>((resolve, reject) => {
    return axios
      .get(fullUrl)
      .then((resp) => {
        resolve(resp.data);
      })
      .catch((err) => reject(err));
  });
}

export function patchAnalysis(studyId: string, analysisId: string, data: any): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    const fullUrl = urlJoin(song_endpoint, `/studies/${studyId}/analysis/${analysisId}`);

    logger.debug(`calling PATCH ${fullUrl}`);

    return axios
      .patch(fullUrl, data, {
        headers: {
          Authorization: `Bearer ${await getEgoToken()}`,
        },
      })
      .then((msg) => {
        logger.debug(
          `analysisId:${analysisId} status:${msg.status} statusText:${
            msg.statusText
          } data:${JSON.stringify(msg.data)}`,
        );
        resolve('OK');
      })
      .catch((err) => reject(err));
  });
}
