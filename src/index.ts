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
import { sendSlackNotification, NOTIFICATION_CATEGORY_ICON } from '@/utils/slackNotifications';
import { todaysDateTimezoned, msToTimeFormat } from '@/utils/dates';
import { analysis_patch_failed, analysis_patch_success } from '@/services/song';

enum Profiles {
  UPDATECACHE = 'UPDATECACHE',
  UPDATEANALYSIS = 'UPDATEANALYSIS',
}

/**
 * Main Function - All work done here
 */
async function runScript(args: any) {
  let argv = minimist(args);
  let profile = _.toUpper(argv.profile);

  logger.info(`Starting script with profile=${profile}`);
  const startTime = process.hrtime.bigint();
  await sendSlackNotification({
    message: { event: 'Starting script', time: todaysDateTimezoned() },
    category: NOTIFICATION_CATEGORY_ICON.INFO,
  });
  try {
    switch (profile) {
      case Profiles.UPDATECACHE:
        // this profile will save in cache all current analysis
        await startLoadCachePipeline();
        break;
      case Profiles.UPDATEANALYSIS:
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
    await sendSlackNotification({
      message: {
        event: 'Script completed',
        time: todaysDateTimezoned(),
        analysisUpdated: analysis_patch_success,
      },
      category: NOTIFICATION_CATEGORY_ICON.INFO,
    });
  } catch (error) {
    logger.error(`Error:${error}`);
    await sendSlackNotification({
      message: {
        event: 'Script finished with error',
        time: todaysDateTimezoned(),
        error: error,
        analysisUpdated: analysis_patch_success,
      },
      category: NOTIFICATION_CATEGORY_ICON.ERROR,
    });
  } finally {
    logger.info(
      `SUMMARY:
      total analysis updated: ${analysis_patch_success}
      total analysis failed: ${analysis_patch_failed}
      Time elapsed: ${msToTimeFormat(process.hrtime.bigint() - startTime)} `,
    );
    disconnectRedis();
    process.exit();
  }
}

/**
 * RUN SCRIPT
 */
runScript(process.argv.slice(2));
