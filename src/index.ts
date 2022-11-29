import * as dotenv from 'dotenv';
dotenv.config({
  debug: process.env.DEBUG === 'true',
});
import minimist from 'minimist';
import _ from 'lodash';

import logger from '@/utils/logger';
import { startLoadCachePipeline } from '@/cache';
import { disconnectRedis } from '@/cache/redisConfig';
import { startUpdateAnalysisPipeline } from '@/services/index';

enum Profiles {
  LOADCACHE = 'LOADCACHE',
  UPDATECACHE = 'UPDATEANALYSIS'
}

/**
 * Main Function - All work done here
 */
async function runScript(args: any) {
  let argv = minimist(args);
  let profile = _.toUpper(argv.profile);

  logger.info(`Starting script with profile=${profile}`);
  try {
    switch (profile) {
      case Profiles.LOADCACHE:
        // this profile will save in cache all current analysis
        await startLoadCachePipeline();
        break;
      case Profiles.UPDATECACHE:
        // this profile will update analysis data using existing cache.
        // if cache is not up to date it will update cache
        await startUpdateAnalysisPipeline();
        break;

      default:
        // this profile will start updating cache to then proceed to update analysis data
        await startLoadCachePipeline().then(startUpdateAnalysisPipeline);
        break;
    }
    logger.info(`Script completed successfully`);
  } catch (error) {
    logger.error(`Error:${error}`);
  } finally {
    disconnectRedis();
    process.exit();
  }
}

/**
 * RUN SCRIPT
 */
runScript(process.argv.slice(2));
