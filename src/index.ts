import * as dotenv from 'dotenv';
dotenv.config({
  debug: process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true',
});
import logger from '@/utils/logger';
import minimist from 'minimist';
import { startLoadCachePipeline } from './cache';
import { disconnectRedis } from './cache/redisConfig';
import { startUpdateAnalysisPipeline } from './services/index';

/**
 * Main Function - All work done here
 */
async function runScript(args: any) {
  let argv = minimist(args);
  logger.info(`Starting script with profile=${argv.profile}`);
  try {
    switch (argv.profile) {
      case 'loadcache':
        // this profile will save in cache all current analysis
        await startLoadCachePipeline();
        break;
      case 'updateanalysis':
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
    process.exit(1);
  }
}

/**
 * RUN SCRIPT
 */
runScript(process.argv.slice(2));
