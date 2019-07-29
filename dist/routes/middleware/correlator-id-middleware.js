"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const correlator_1 = require("../../utils/correlator");
// Based on: https://medium.com/@evgeni.kisel/add-correlation-id-in-node-js-applications-fde759eed5e3
function correlationIdMiddleware(req, res, next) {
    correlator_1.bindEmitter(req);
    correlator_1.bindEmitter(res);
    correlator_1.bindEmitter(req.socket);
    correlator_1.withCorrelationId(() => {
        const currentCorrelationId = correlator_1.getCorrelationId();
        res.set(`x-correlation-id`, currentCorrelationId); // Add the id to a header in the response.
        next();
    }, req.get(`x-correlation-id`)); // If the incoming request included an id then use this. 
}
exports.correlationIdMiddleware = correlationIdMiddleware;
//# sourceMappingURL=correlator-id-middleware.js.map