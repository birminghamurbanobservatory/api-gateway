// TODO: Should the env be passed into this function from server.js instead?
import * as logger from 'node-logger';
import {OperationalError} from '../errors';
import {statusCodeToStatus} from '../utils/status-code-to-status';
import {config} from '../config';
import {EventStreamOperationalError} from 'event-stream';

const env = config.common.env;

                                             //  v-- need to keep this 'next'
export function handleRouteErrors(err, req, res, next): void {

  const inDevMode = env === 'development';

  //-------------------------------------------------
  // Operational Errors
  //-------------------------------------------------
  // TODO: Need to make sure that operational event stream errors will count here, i.e. a error response from the responding microservice which should be passed onto the client.
  if (err instanceof OperationalError || err instanceof EventStreamOperationalError) {

    //------------------------
    // In production
    //------------------------
    const response: any = {
      statusCode: err.statusCode || 500,
      status: statusCodeToStatus(err.statusCode || 500),
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
  } else {

    const statusCodeForProgErrors = 500;

    //------------------------
    // In development
    //------------------------
    if (inDevMode) {

      return res.status(statusCodeForProgErrors).send(err.stack);

    //------------------------
    // In production
    //------------------------
    } else {

      return res.status(statusCodeForProgErrors).json({
        statusCode: statusCodeForProgErrors,
        status: statusCodeToStatus(statusCodeForProgErrors),
        errorCode: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred on the server'
      });  

    }

  }

};