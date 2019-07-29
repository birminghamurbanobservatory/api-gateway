//------------------------------------------------- 
// Dependencies
//-------------------------------------------------
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';
import express from 'express';
import {RootRouter} from './root';
import {logRouteErrors} from './log-errors';
import {handleRouteErrors} from './handle-errors';
import {correlationIdMiddleware} from './middleware/correlator-id-middleware';
import {DeploymentRouter} from '../components/deployment/deployment.router';
import {InvalidBody} from '../errors/InvalidBody';
import * as logger from 'node-logger';
import {config} from '../config';
import morgan = require('morgan');


export const app = express();

//-------------------------------------------------
// Middleware
//-------------------------------------------------
// Add the correlationId middleware
app.use(correlationIdMiddleware);


// Allow for POST requests
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
// TODO: Do I need method override?


// Logs this as soon as the request comes in
app.use(morgan(`:method :url`, {
  stream: {write: (text) => logger.debug(text.trim())},
  immediate: true,
}));
// Logs this as the response goes out
app.use(morgan(`:method :status :url (:res[content-length] bytes) :response-time ms`, {
  stream: {write: (text) => logger.debug(text.trim())},
  immediate: false,
}));


// Catch malformed body
// By default the bodyParser middleware returns its own error when the request body has invalid syntax, e.g the json message didn't close an open quotation mark. bodyParser gives these errors an instance of SyntaxError, with a status of 400, and a body property, giving us a way of catching just these types of error. Works on verbs other than just POST.
// For some reason if I try to move this code into a route it no longer works.
app.use('/', (err, req, res, next) => {
  // @ts-ignore: In this instance SyntaxError does have a status property
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // TODO: use a custom error here, e.g. InvalidBody.
    return next(new InvalidBody('The request body is malformed'));
  } else {
    next();
  }
});


//-------------------------------------------------
// Routes
//-------------------------------------------------
app.use(RootRouter);
app.use(DeploymentRouter);
// Error handling must go last
app.use(logRouteErrors);
app.use(handleRouteErrors)