//------------------------------------------------- 
// Dependencies
//-------------------------------------------------
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';
import express from 'express';
import {RootRouter} from './root';
import {logRouteErrors} from './log-errors';
import {handleRouteErrors} from './handle-errors';

export const app = express();

//-------------------------------------------------
// Middleware
//-------------------------------------------------
// Allow for POST requests
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
// TODO: Do I need method override?

// Catch malformed body
// By default the bodyParser middleware returns its own error when the request body has invalid syntax, e.g the json message didn't close an open quotation mark. bodyParser gives these errors an instance of SyntaxError, with a status of 400, and a body property, giving us a way of catching just these types of error. Works on verbs other than just POST.
// For some reason if I try to move this code into a route it no longer works.
app.use('/', (err, req, res, next) => {
  // @ts-ignore: In this instance SyntaxError does have a status property
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // TODO: use a custom error here, e.g. InvalidBody.
    return next(new Error('The request body is malformed'));
  } else {
    next();
  }
});


//-------------------------------------------------
// Routes
//-------------------------------------------------
app.use(RootRouter);
// Error handling must go last
app.use(logRouteErrors);
app.use(handleRouteErrors)