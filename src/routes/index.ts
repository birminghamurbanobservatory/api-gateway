//------------------------------------------------- 
// Dependencies
//-------------------------------------------------
import * as bodyParser from 'body-parser';
import methodOverride from 'method-override';
import express from 'express';
import {RootRouter} from './root';
import {logRouteErrors} from './log-errors';
import {handleRouteErrors} from './handle-errors';
import {correlationIdMiddleware} from './middleware/correlator-id-middleware';
import {DeploymentRouter} from '../components/deployment/deployment.router';
import {InvalidBody} from '../errors/InvalidBody';
import * as logger from 'node-logger';
import morgan = require('morgan');
import {lookForUserCredentials} from './middleware/authenticator';
import {SensorRouter} from '../components/sensor/sensor.router';
import {PlatformRouter} from '../components/platform/platform.router';
import {UserRouter} from '../components/users/users.router';
import {PermanentHostRouter} from '../components/permanent-host/permanent-host.router';
import {ObservationRouter} from '../components/observation/observation.router';
import {RegisterRouter} from '../components/register/register.router';


export const app = express();

//-------------------------------------------------
// Middleware
//-------------------------------------------------
// Add the correlationId middleware
app.use(correlationIdMiddleware);


// Allow for POST requests
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
app.use(methodOverride());


// Logs this as soon as the request comes in
app.use(morgan(`:method :url`, {
  stream: {write: (text): any => logger.debug(text.trim())},
  immediate: true,
}));
// Logs this as the response goes out
app.use(morgan(`:method :status :url (:res[content-length] bytes) :response-time ms`, {
  stream: {write: (text): any => logger.debug(text.trim())},
  immediate: false,
}));


// Catch malformed body
// By default the bodyParser middleware returns its own error when the request body has invalid syntax, e.g the json message didn't close an open quotation mark. bodyParser gives these errors an instance of SyntaxError, with a status of 400, and a body property, giving us a way of catching just these types of error. Works on verbs other than just POST.
// For some reason if I try to move this code into a route it no longer works.
app.use('/', (err, req, res, next): any => {
  // @ts-ignore: In this instance SyntaxError does have a status property
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // TODO: use a custom error here, e.g. InvalidBody.
    return next(new InvalidBody('The request body is malformed'));
  } else {
    next();
  }
});


// Pull out any authentication credentials
app.use(lookForUserCredentials);

//-------------------------------------------------
// Routes
//-------------------------------------------------
app.use(RootRouter);
app.use(DeploymentRouter);
app.use(UserRouter);
app.use(PlatformRouter); // must come after the DeploymentRouter
app.use(SensorRouter);
app.use(PermanentHostRouter);
app.use(ObservationRouter);
app.use(RegisterRouter);

// Error handling must go last
app.use(logRouteErrors);
app.use(handleRouteErrors);

// Handle routes that don't exist (this must go at the end)
app.use((req, res): any => {
  return res.status(404).json({
    statusCode: 404,
    status: 'Not Found',
    errorCode: 'EndpointNotFound',
    message: 'This API endpoint has not been defined.'
  });
});