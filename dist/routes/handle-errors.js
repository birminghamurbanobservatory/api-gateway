"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors");
const status_code_to_status_1 = require("../utils/status-code-to-status");
const config_1 = require("../config");
const event_stream_1 = require("event-stream");
const env = config_1.config.common.env;
//  v-- need to keep this 'next'
function handleRouteErrors(err, req, res, next) {
    const inDevMode = env === 'development';
    //-------------------------------------------------
    // Operational Errors
    //-------------------------------------------------
    // TODO: Need to make sure that operational event stream errors will count here, i.e. a error response from the responding microservice which should be passed onto the client.
    if (err instanceof errors_1.OperationalError || err instanceof event_stream_1.EventStreamOperationalError) {
        //------------------------
        // In production
        //------------------------
        const response = {
            statusCode: err.statusCode || 500,
            status: status_code_to_status_1.statusCodeToStatus(err.statusCode || 500),
            errorCode: err.name,
            message: err.message
        };
        //------------------------
        // In development
        //------------------------
        // Add extra detail
        if (inDevMode) {
            response.privateMessage = err.privateMessage;
        }
        return res.status(response.statusCode).json(response);
        //-------------------------------------------------
        // Programmer Errors
        //-------------------------------------------------
    }
    else {
        const statusCodeForProgErrors = 500;
        //------------------------
        // In development
        //------------------------
        if (inDevMode) {
            return res.status(statusCodeForProgErrors).send(err.stack);
            //------------------------
            // In production
            //------------------------
        }
        else {
            return res.status(statusCodeForProgErrors).json({
                statusCode: statusCodeForProgErrors,
                status: status_code_to_status_1.statusCodeToStatus(statusCodeForProgErrors),
                errorCode: 'UNEXPECTED_ERROR',
                message: 'An unexpected error occurred on the server'
            });
        }
    }
}
exports.handleRouteErrors = handleRouteErrors;
;
//# sourceMappingURL=handle-errors.js.map