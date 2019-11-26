"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
//-------------------------------------------------
// Dependencies
//-------------------------------------------------
const config_1 = require("./config");
const logger = __importStar(require("node-logger"));
const appName = require('../package.json').name; // Annoyingly if i use import here, the built app doesn't update.
const routes_1 = require("./routes");
const initialise_events_1 = require("./events/initialise-events");
const correlator_1 = require("./utils/correlator");
//-------------------------------------------------
// Logging
//-------------------------------------------------
logger.configure(Object.assign({}, config_1.config.logger, { getCorrelationId: correlator_1.getCorrelationId }));
logger.warn(`${appName} restarted`);
//-------------------------------------------------
// Event stream
//-------------------------------------------------
(async () => {
    try {
        await initialise_events_1.initialiseEvents({
            url: config_1.config.events.url,
            appName
        });
    }
    catch (err) {
        logger.error('There was an issue whilst initialising events.', err);
    }
    return;
})();
//-------------------------------------------------
// Server
//-------------------------------------------------
const port = 80;
routes_1.app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map