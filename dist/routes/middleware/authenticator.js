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
async function lookForUserCredentials(req, res, next) {
    req.user = {};
    // TODO: i.e. see if a JWT or apiKey is present in the authorization header.
    // Temporary solution (TODO; replace this with JWT and apiKeys later)
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'userId') {
        req.user.id = req.headers.authorization.split(' ')[1];
        logger.debug(`User id ${req.user.id} was provided in the autorization header`);
    }
    if (!req.user.id) {
        logger.debug('Request did not supply a user id ');
    }
    next();
}
exports.lookForUserCredentials = lookForUserCredentials;
//# sourceMappingURL=authenticator.js.map