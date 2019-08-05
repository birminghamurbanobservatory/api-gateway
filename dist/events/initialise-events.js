"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const event = __importStar(require("event-stream"));
// const event = require('event-stream');
const logger = __importStar(require("node-logger"));
const correlator_1 = require("../utils/correlator");
const config_1 = require("../config");
async function initialiseEvents(settings) {
    logger.debug('Initalising events stream');
    if (logIt('error', config_1.config.events.logLevel)) {
        event.logsEmitter.on('error', (msg) => {
            logger.error(msg);
        });
    }
    if (logIt('warn', config_1.config.events.logLevel)) {
        event.logsEmitter.on('warn', (msg) => {
            logger.warn(msg);
        });
    }
    if (logIt('info', config_1.config.events.logLevel)) {
        event.logsEmitter.on('info', (msg) => {
            logger.info(msg);
        });
    }
    if (logIt('debug', config_1.config.events.logLevel)) {
        event.logsEmitter.on('debug', (msg) => {
            logger.debug(msg);
        });
    }
    try {
        await event.init({
            url: settings.url,
            appName: settings.appName,
            withCorrelationId: correlator_1.withCorrelationId,
            getCorrelationId: correlator_1.getCorrelationId
        });
        logger.debug('Event stream initialisation went ok');
    }
    catch (err) {
        // TODO: Having some issues with unhandled errors when we can't connect to the event-stream during initialisation.
        logger.error('Failed to initialise event-stream', err);
    }
    function logIt(level, configSetting) {
        const levels = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(configSetting);
    }
}
exports.initialiseEvents = initialiseEvents;
//# sourceMappingURL=initialise-events.js.map