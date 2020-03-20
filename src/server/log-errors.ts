import * as logger from 'node-logger';
import {OperationalError, DatabaseError} from '../errors';
import {EventStreamOperationalError} from 'event-stream';

export function logRouteErrors(err, req, res, next): void {

  //------------------------
  // Operational errors
  //------------------------
  if (err instanceof OperationalError || err instanceof EventStreamOperationalError) {

    if (err instanceof DatabaseError) {
      // More serious
      logger.error(err);
    } else {
      // Less serious
      logger.warn(err);
    }

  //------------------------
  // Programmer errors
  //------------------------
  } else {
    logger.error(err);
  }

  next(err);

};