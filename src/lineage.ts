import logger from '@/logger';

import { pipelineSource } from './storage';
import { initCache } from './cache';

export const startUpdateLineageScript = function (useCache: boolean) {
  logger.info(`startUpdateLineageScript useCache:${useCache}`);

  if (!useCache) {
    initCache().then(pipelineSource);
  } else {
    pipelineSource();
  }
};
