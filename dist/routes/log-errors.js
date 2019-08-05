"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger = __importStar(require("node-logger"));
const errors_1 = require("../errors");
const event_stream_1 = require("event-stream");
function logRouteErrors(err, req, res, next) {
    //------------------------
    // Operational errors
    //------------------------
    if (err instanceof errors_1.OperationalError || err instanceof event_stream_1.EventStreamOperationalError) {
        if (err instanceof errors_1.DatabaseError) {
            // More serious
            logger.error(err);
        }
        else {
            // Less serious
            logger.warn(err);
        }
        //------------------------
        // Programmer errors
        //------------------------
    }
    else {
        logger.error(err);
    }
    next(err);
}
exports.logRouteErrors = logRouteErrors;
;
//# sourceMappingURL=log-errors.js.map