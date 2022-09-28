import * as dotenv from 'dotenv';
dotenv.config({
  debug: process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true',
});
import logger from '@/logger';
import minimist from 'minimist';
import { initCache } from './cache';
import { startUpdateLineageScript } from './lineage'


/**
 * Main Function - All work done here
 */
async function runScript(args: any) {
  let argv = minimist(args);
  logger.info(`Starting script with profile=${argv.profile}`);
  switch (argv.profile) {
    case 'updatecache':
      // this profile will save in cache all current analysis
      initCache();
      break;
    case 'updatelineage':
      // this profile will update Lineage data using cache
      startUpdateLineageScript(true)
      break;

    default:
      // this profile will update Lineage data without using cache
      startUpdateLineageScript(false)
      break;
  }
}

/**
 * RUN SCRIPT
 */
runScript(process.argv.slice(2));
