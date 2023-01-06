import moment from 'moment-timezone';
import { config } from '@/config/index';

export const todaysDateTimezoned = (): string => {
  return moment().tz(config.server.timezone).format('MMMM Do YYYY, h:mm:ss a z');
};

export function msToTimeFormat(ns: bigint) {
  // convert nanoseconds to milliseconds
  const ms = Number(ns) / 1e6;
  // time format 23:59:59
  return moment.utc(moment.duration(Number(ms)).asMilliseconds()).format('HH:mm:ss');
}
