"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: Should the env be passed into this function from server.js instead?
const env = require('../../config').common.env;
const logger = require('node-logger');
const { OperationalError } = require('../errors');
const statusCodeToStatus = require('../utils/status-code-to-status');
const pascalToSnakeCaps = require('../utils/pascal-to-snake-caps');
//  v-- need to keep this 'next'
function handleRouteErrors(err, req, res, next) {
    const inDevMode = env === 'development';
    //-------------------------------------------------
    // Operational Errors
    //-------------------------------------------------
    if (err instanceof OperationalError) {
        //------------------------
        // In production
        //------------------------
        const response = {
            statusCode: err.statusCode,
            status: statusCodeToStatus(err.statusCode),
            errorCode: pascalToSnakeCaps(err.name),
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
                status: statusCodeToStatus(statusCodeForProgErrors),
                errorCode: 'UNEXPECTED_ERROR',
                message: 'An unexpected error occurred on the server'
            });
        }
    }
}
exports.handleRouteErrors = handleRouteErrors;
;
//# sourceMappingURL=handle-errors.js.map