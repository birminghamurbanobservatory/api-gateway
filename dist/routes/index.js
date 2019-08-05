"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//------------------------------------------------- 
// Dependencies
//-------------------------------------------------
const bodyParser = __importStar(require("body-parser"));
const express_1 = __importDefault(require("express"));
const root_1 = require("./root");
const log_errors_1 = require("./log-errors");
const handle_errors_1 = require("./handle-errors");
const correlator_id_middleware_1 = require("./middleware/correlator-id-middleware");
const deployment_router_1 = require("../components/deployment/deployment.router");
const InvalidBody_1 = require("../errors/InvalidBody");
const logger = __importStar(require("node-logger"));
const morgan = require("morgan");
const authenticator_1 = require("./middleware/authenticator");
exports.app = express_1.default();
//-------------------------------------------------
// Middleware
//-------------------------------------------------
// Add the correlationId middleware
exports.app.use(correlator_id_middleware_1.correlationIdMiddleware);
// Allow for POST requests
exports.app.use(bodyParser.json()); // for parsing application/json
exports.app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
// TODO: Do I need method override?
// Logs this as soon as the request comes in
exports.app.use(morgan(`:method :url`, {
    stream: { write: (text) => logger.debug(text.trim()) },
    immediate: true,
}));
// Logs this as the response goes out
exports.app.use(morgan(`:method :status :url (:res[content-length] bytes) :response-time ms`, {
    stream: { write: (text) => logger.debug(text.trim()) },
    immediate: false,
}));
// Catch malformed body
// By default the bodyParser middleware returns its own error when the request body has invalid syntax, e.g the json message didn't close an open quotation mark. bodyParser gives these errors an instance of SyntaxError, with a status of 400, and a body property, giving us a way of catching just these types of error. Works on verbs other than just POST.
// For some reason if I try to move this code into a route it no longer works.
exports.app.use('/', (err, req, res, next) => {
    // @ts-ignore: In this instance SyntaxError does have a status property
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        // TODO: use a custom error here, e.g. InvalidBody.
        return next(new InvalidBody_1.InvalidBody('The request body is malformed'));
    }
    else {
        next();
    }
});
//-------------------------------------------------
// Routes
//-------------------------------------------------
exports.app.use(authenticator_1.lookForUserCredentials);
exports.app.use(root_1.RootRouter);
exports.app.use(deployment_router_1.DeploymentRouter);
// Error handling must go last
exports.app.use(log_errors_1.logRouteErrors);
exports.app.use(handle_errors_1.handleRouteErrors);
//# sourceMappingURL=index.js.map