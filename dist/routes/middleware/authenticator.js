"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function lookForUserCredentials(req, res, next) {
    req.user = {};
    // TODO: i.e. see if a JWT or apiKey is present in the authorization header.
    next();
}
exports.lookForUserCredentials = lookForUserCredentials;
//# sourceMappingURL=authenticator.js.map