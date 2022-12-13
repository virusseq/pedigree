import axios from 'axios';
import urlJoin from 'url-join';
import axiosRetry from 'axios-retry';

import logger from '@/utils/logger';
import { config } from '@/config';
import { getEgoToken } from '@/security/ego';

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

export type LineageAnalysis = {
  lineage_name: string;
  lineage_analysis_software_name: string;
  lineage_analysis_software_version: string;
  lineage_analysis_software_data_version: string;
  scorpio_call: string;
  scorpio_version: string;
};

export type Analysis = {
  analysisId?: string;
  studyId?: string;
  analysisType?: AnalysisType;
  samples?: Array<Sample>;
  lineage_analysis?: LineageAnalysis;
};

// Exponential back-off retry delay between requests
axiosRetry(axios, { retries: config.server.apiRetries, retryDelay: axiosRetry.exponentialDelay });

export function getAllStudies(): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const fullUrl = urlJoin(config.song.endpoint, '/studies/all');
    return axios
      .get(fullUrl)
      .then((resp) => {
        logger.info(`found ${resp.data?.length} studies`);
        resolve(resp.data);
      })
      .catch((err) => reject(new Error(`SONG API ${fullUrl} error:${err}`)));
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
    config.song.endpoint,
    `/studies/${studyId}/analysis/paginated?analysisStates=${analysisState}&limit=${limit}&offset=${offset}`,
  );

  return new Promise<GetAnalysesForStudyResponse>((resolve, reject) => {
    return axios
      .get(fullUrl)
      .then((resp) => {
        resolve(resp.data);
      })
      .catch((err) => reject(new Error(`SONG API ${fullUrl} error:${err}`)));
  });
}

export function patchAnalysis(studyId: string, analysisId: string, data: any): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    const fullUrl = urlJoin(config.song.endpoint, `/studies/${studyId}/analysis/${analysisId}`);

    logger.debug(`calling PATCH ${fullUrl} request: ${JSON.stringify(data)}`);

    return axios
      .patch(fullUrl, data, {
        headers: {
          Authorization: `Bearer ${await getEgoToken()}`,
        },
      })
      .then((msg) => {
        logger.info(`analysisId:${analysisId} status:${msg.status}}`);
        resolve('OK');
      })
      .catch((err) => reject(new Error(`SONG API ${fullUrl} error:${err}`)));
  });
}
