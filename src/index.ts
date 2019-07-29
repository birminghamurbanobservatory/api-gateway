//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import {config} from './config';
import * as logger from 'node-logger';
const appName = require('../package.json').name; // Annoyingly if i use import here, the built app doesn't update.
import {app} from './routes';
import {initialiseEvents} from './events/initialise-events';
import {getCorrelationId} from './utils/correlator';


//-------------------------------------------------
// Logging
//-------------------------------------------------
logger.configure(Object.assign({}, config.logger, {getCorrelationId}));
logger.warn(`${appName} restarted`);


//-------------------------------------------------
// Event stream
//-------------------------------------------------
(async (): Promise<void> => {
  try {
    await initialiseEvents({
      url: config.events.url,
      appName
    });
  } catch (err) {
    logger.error('There was an issue whilst initialising events.', err);
  }
  return;
})();


//-------------------------------------------------
// Server
//-------------------------------------------------
const port = 80;
app.listen(port, () => {
  logger.info(`Server is running on port ${80}`);
});