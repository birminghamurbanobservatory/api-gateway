//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {proximityCentreConditional} from '../../utils/custom-joi-validations';
import {pick, omit} from 'lodash';
import {addMetaLinks} from '../common/add-meta-links';
import {validateAgainstSchema} from '../schemas/json-schema-validator';
import {getTimeseriesObservations} from './timeseries-obs.controller';
import {config} from '../../config';
import * as check from 'check-types';

const router = express.Router();

export {router as TimeseriesObsRouter};



//-------------------------------------------------
// Get Timeseries's Observations
//-------------------------------------------------
const getTimeseriesObservationsQuerySchema = joi.object({
  resultTime__gt: joi.string().isoDate(),
  resultTime__gte: joi.string().isoDate(),
  resultTime__lt: joi.string().isoDate(),
  resultTime__lte: joi.string().isoDate(),
  flags__exists: joi.boolean(),
  // spatial
  latitude__gt: joi.number().min(-90).max(90),
  latitude__gte: joi.number().min(-90).max(90),
  latitude__lt: joi.number().min(-90).max(90),
  latitude__lte: joi.number().min(-90).max(90),
  longitude__gt: joi.number().min(-180).max(180),
  longitude__gte: joi.number().min(-180).max(180),
  longitude__lt: joi.number().min(-180).max(180),
  longitude__lte: joi.number().min(-180).max(180),
  height__gt: joi.number().min(-180).max(180),
  height__gte: joi.number().min(-180).max(180),
  height__lt: joi.number().min(-180).max(180),
  height__lte: joi.number().min(-180).max(180),
  proximityCentre: joi.string().custom(proximityCentreConditional),
  proximityRadius: joi.number().min(0),
  // options
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  sortBy: joi.string().valid('resultTime').default('resultTime'),
  sortOrder: joi.string().valid('asc', 'desc').default('desc')
})
.without('resultTime__gt', 'resultTime__gte')
.without('resultTime__lt', 'resultTime__lte');

router.get('/timeseries/:timeseriesId/observations', asyncWrapper(async (req, res): Promise<any> => {

  const timeseriesId = req.params.timeseriesId;

  logger.debug('Raw query parameters', req.query);
  const {error: queryErr, value: query} = getTimeseriesObservationsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);  
  logger.debug('Validated query parameters', query);

  // To help with pagination let's set a default upper limit for the resultTime to now.
  if (check.not.assigned(query.resultTime__lt) && check.not.assigned(query.resultTime__lte)) {
    query.resultTime__lte = new Date().toISOString();
  }

  if (check.assigned(query.proximityCentre)) {
    query.proximity = {
      centre: query.proximityCentre,
      radius: query.proximityRadius
    };
    delete query.proximityCentre;
    delete query.proximityRadius;
  }

  // Pull out the options
  const optionKeys = ['limit', 'offset', 'sortBy', 'sortOrder'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = omit(query, optionKeys);
  const where = convertQueryToWhere(wherePart);

  let jsonResponse = await getTimeseriesObservations(timeseriesId, where, options, req.user);
  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/timeseries/${timeseriesId}/observations`, query);
  // validateAgainstSchema(jsonResponse, 'timeseries-observations-get-response-body');
  return res.json(jsonResponse);

}));


