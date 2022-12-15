import moment from 'moment-timezone';
import { config } from '@/config/index';

export const todaysDateTimezoned = (): string => {
  return moment().tz(config.server.timezone).format('MMMM Do YYYY, h:mm:ss a z');
};
