import axios from 'axios';

import logger from './logger';
import { config } from '@/config';

export enum NOTIFICATION_CATEGORY_ICON {
  INFO = ':information_source:',
  ERROR = ':bang_bang:',
  WARN = ':warning:',
}

export const sendSlackNotification = async ({
  message,
  category,
}: {
  message: Record<string, string>;
  category: NOTIFICATION_CATEGORY_ICON;
}): Promise<void> => {
  if (config.notifications?.slack_url) {
    logger.debug(`Attempting to send Slack notification...`);

    const header = `${category} Script status`;
    const body = Object.entries(message)
      .flatMap(([key, val]) => `>*${key}:* ${val}\n`)
      .join('');

    const payload = `${header}\n${body}`;

    await axios
      .post(config.notifications.slack_url, {
        text: payload,
      })
      .then(() => {
        logger.debug('Slack notification sent successfully.');
      })
      .catch((err) => {
        logger.error(`Error sending slack notification: ${err}.`);
      });
  }
};
