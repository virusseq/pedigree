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
  analysisId: string;
  studyId: string;
  analysisType?: AnalysisType;
  samples?: Array<Sample>;
  lineage_analysis?: LineageAnalysis;
};

export let analysis_patch_success: number = 0;
export let analysis_patch_failed: number = 0;

// retry after a timeout is reached
axiosRetry(axios, {
  retries: config.server.apiRetries,
  shouldResetTimeout: true,
  onRetry(retryCount, error, requestConfig) {
    logger.error(`Song retryCount:${retryCount}; ${error}; Retrying URL:${requestConfig.url}`);
  },
  retryCondition: (err) =>
    err.code === 'ECONNABORTED' || axiosRetry.isNetworkOrIdempotentRequestError(err),
});

export function getAllStudies(): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const fullUrl = urlJoin(config.song.endpoint, '/studies/all');
    return axios
      .get(fullUrl, { timeout: config.server.apiTimeout })
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
    `getAnalysisByStudyPaginated - fetching limit:${limit} analysis for study:${studyId} offset:${offset}`,
  );

  const fullUrl = urlJoin(
    config.song.endpoint,
    `/studies/${studyId}/analysis/paginated?analysisStates=${analysisState}&limit=${limit}&offset=${offset}`,
  );

  return new Promise<GetAnalysesForStudyResponse>((resolve, reject) => {
    return axios
      .get(fullUrl, { timeout: config.server.apiTimeout })
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
          Authorization: `Bearer ${await getEgoToken().catch(reject)}`,
        },
        timeout: config.server.apiTimeout,
      })
      .then((msg) => {
        analysis_patch_success++;
        logger.info(
          `# success analysis:${analysis_patch_success} analysisId:${analysisId} status:${msg.status}}`,
        );
        resolve('OK');
      })
      .catch((err) => {
        analysis_patch_failed++;
        logger.error(`SONG API ${fullUrl} error:${err}`);
        reject(new Error(`SONG API ${fullUrl} error:${err}`));
      });
  });
}
