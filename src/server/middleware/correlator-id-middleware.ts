import {withCorrelationId, getCorrelationId, bindEmitter} from '../../utils/correlator';

// Based on: https://medium.com/@evgeni.kisel/add-correlation-id-in-node-js-applications-fde759eed5e3

export function correlationIdMiddleware(req, res, next): void {

  bindEmitter(req);
  bindEmitter(res);
  bindEmitter(req.socket);

  withCorrelationId((): void => {
    const currentCorrelationId = getCorrelationId();
    res.set(`x-correlation-id`, currentCorrelationId); // Add the id to a header in the response.
    next();
  }, req.get(`x-correlation-id`)); // If the incoming request included an id then use this. 

}