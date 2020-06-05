//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {getSingleTimeseries, getMultipleTimeseries, deleteSingleTimeseries, mergeTimeseries} from './timeseries.controller';
import * as logger from 'node-logger';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {inConditional, ancestorPlatformConditional, kebabCaseValidation} from '../../utils/custom-joi-validations';
import {config} from '../../config';
import {pick, omit} from 'lodash';
import {addMetaLinks} from '../common/add-meta-links';
import {validateAgainstSchema} from '../schemas/json-schema-validator';

const router = express.Router();

export {router as TimeseriesRouter};


//-------------------------------------------------
// Get Single Timeseries
//-------------------------------------------------
router.get('/timeseries/:timeseriesId', asyncWrapper(async (req, res): Promise<any> => {

  const timeseriesId = req.params.timeseriesId;
  const jsonResponse = await getSingleTimeseries(timeseriesId, req.user);
  validateAgainstSchema(jsonResponse, 'single-timeseries-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Get Multiple Timeseries
//-------------------------------------------------
const getTimeseriesQuerySchema = joi.object({
  id__in: joi.string().custom(inConditional),
  madeBySensor: joi.string(),
  madeBySensor__in: joi.string().custom(inConditional),
  observedProperty: joi.string(),
  aggregation: joi.string(),
  aggregation__in: joi.string().custom(inConditional),
  unit: joi.string(),
  unit__in: joi.string().custom(inConditional),
  unit__exists: joi.boolean(),
  hasFeatureOfInterest: joi.string(),
  disciplines__includes: joi.string(),
  hasDeployment: joi.string(),
  hasDeployment__in: joi.string().custom(inConditional), // inConditional converts common-delimited string to array.
  // if you ever allow the __exists conditional then make sure it doesn't allow unauthenticed users access to get observations from restricted deployments.
  ancestorPlatforms: joi.string().custom(ancestorPlatformConditional), // for an exact match, e.g. west-school .weather-station-1 TODO: could also allow something like west-school.weather-station-1.* for a lquery style filter.
  ancestorPlatforms__includes: joi.string().custom(kebabCaseValidation), // platform occurs anywhere in path, e.g. west-school
  startDate__gt: joi.string().isoDate(),
  startDate__gte: joi.string().isoDate(),
  startDate__lt: joi.string().isoDate(),
  startDate__lte: joi.string().isoDate(),
  endDate__gt: joi.string().isoDate(),
  endDate__gte: joi.string().isoDate(),
  endDate__lt: joi.string().isoDate(),
  endDate__lte: joi.string().isoDate(),
  // options
  limit: joi.number().integer().positive().max(500).default(100),
  offset: joi.number().integer().min(0).default(0),
  // For now at least there's not much point in letting them sort, as it will always default to the id, that is hashed anyway and will therefore the client id will end up out of order anyway.
})
.required();


router.get('/timeseries', asyncWrapper(async (req, res): Promise<any> => {

  logger.debug('Raw query parameters', req.query);
  const {error: queryErr, value: query} = getTimeseriesQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);  
  logger.debug('Validated query parameters', query);

  // TODO: Should I be using a populate query parameter here as well? Seems a bit excessive to return as much information as it is currently.

  // Pull out the options
  const optionKeys = ['limit', 'offset', 'sortBy', 'sortOrder'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = omit(query, optionKeys);
  const where = convertQueryToWhere(wherePart);
 
  let jsonResponse = await getMultipleTimeseries(where, options, req.user);
  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/timeseries`, query);
  validateAgainstSchema(jsonResponse, 'multiple-timeseries-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Merge Timeseries
//-------------------------------------------------
router.post('/timeseries/:timeseriesId/merge', asyncWrapper(async (req, res): Promise<any> => {

  const goodIdToKeep = req.params.timeseriesId;
  const body = validateAgainstSchema(req.body, 'timeseries-merge-request-body');

  const jsonResponse = await mergeTimeseries(goodIdToKeep, body, req.user);
  validateAgainstSchema(jsonResponse, 'timeseries-merge-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Delete Timeseries
//-------------------------------------------------
router.delete('/timeseries/:timeseriesId', asyncWrapper(async (req, res): Promise<any> => {
  const timeseriesId = req.params.timeseriesId;
  logger.debug(`Deleting timeseries ${timeseriesId}`);
  await deleteSingleTimeseries(timeseriesId, req.user);
  return res.status(204).send();
}));