"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors");
const status_code_to_status_1 = require("../utils/status-code-to-status");
const config_1 = require("../config");
const env = config_1.config.common.env;
//  v-- need to keep this 'next'
function handleRouteErrors(err, req, res, next) {
    const inDevMode = env === 'development';
    // TODO: Return the correlation ID to the client. I.e. if a user has an issue they can tell me the correlation id they get back and I can look up the issue. Either in the json response, or as a header.
    //-------------------------------------------------
    // Operational Errors
    //-------------------------------------------------
    // TODO: Need to make sure that operational event stream errors will count here, i.e. a error response from the responding microservice which should be passed onto the client.
    if (err instanceof errors_1.OperationalError) {
        //------------------------
        // In production
        //------------------------
        const response = {
            statusCode: err.statusCode,
            status: status_code_to_status_1.statusCodeToStatus(err.statusCode),
            errorCode: err.name,
            message: err.message
        };
        //------------------------
        // In development
        //------------------------
        // Add extra detail
        if (inDevMode) {
            response.privateMessage = err.privateMessage;
            response.name = err.name;
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