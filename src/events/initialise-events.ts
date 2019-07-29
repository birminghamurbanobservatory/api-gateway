import * as event from 'event-stream';
import * as logger from 'node-logger';
import {withCorrelationId, getCorrelationId} from '../utils/correlator';
import {config} from '../config';

export async function initialiseEvents(settings: {url: string; appName: string}): Promise<void> {

  try {
    await event.init({
      url: settings.url,
      appName: settings.appName,
      withCorrelationId,
      getCorrelationId
    });
  } catch (err) {
    logger.error('Failed to initialise event-stream', err);
  }

  if (logIt('error', config.logger.level)) {
    event.logsEmitter.on('error', (msg): void => {
      logger.error(msg);
    });
  }
  if (logIt('warn', config.logger.level)) {
    event.logsEmitter.on('warn', (msg): void => {
      logger.warn(msg);
    });
  }
  if (logIt('info', config.logger.level)) {
    event.logsEmitter.on('info', (msg): void => {
      logger.info(msg);
    });
  }
  if (logIt('debug', config.logger.level)) {
    event.logsEmitter.on('debug', (msg): void => {
      logger.debug(msg);
    });
  }

  function logIt(level, configSetting): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(configSetting);
  }

}