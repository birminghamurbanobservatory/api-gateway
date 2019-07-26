//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import {config} from './config';
import * as logger from 'node-logger';
const appName = require('../package.json').name; // Annoyingly if i use import here, the built app doesn't update.
import {app} from './routes';


//-------------------------------------------------
// Logging
//-------------------------------------------------
logger.configure(config.logger);
logger.warn(`${appName} restarted`);


//-------------------------------------------------
// Server
//-------------------------------------------------
const port = 80;
app.listen(port, () => {
  logger.info(`Server is running on port ${80}`);
});