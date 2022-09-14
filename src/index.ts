require('dotenv').config({
  debug: process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true',
});

import logger from '@/logger';

/**
 * Main Function - All work done here
 */
async function runScript() {
  logger.debug('Service is running!');
}

/**
 * RUN SCRIPT
 */
runScript();
