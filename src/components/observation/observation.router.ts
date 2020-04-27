//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import * as logger from 'node-logger';
import {getObservations, getObservation, deleteObservation, createObservation} from './observation.controller';
import {InvalidObservation} from './errors/InvalidObservation';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {pick, cloneDeep, omit} from 'lodash';
import {Promise} from 'bluebird';
import {inConditional, ancestorPlatformConditional, kebabCaseValidation, proximityCentreConditional} from '../../utils/custom-joi-validations';
import {config} from '../../config';
import {queryObjectToQueryString} from '../../utils/query-object-to-querystring';
import * as check from 'check-types';

const router = express.Router();

export {router as ObservationRouter};


//-------------------------------------------------
// Get observations
//-------------------------------------------------
const getObservationsQuerySchema = joi.object({
  // filtering
  madeBySensor: joi.string(),
  madeBySensor__in: joi.string().custom(inConditional),
  observedProperty: joi.string(),
  unit: joi.string(),
  unit__in: joi.string().custom(inConditional),
  unit__exists: joi.boolean(),
  hasFeatureOfInterest: joi.string(),
  disciplines__includes: joi.string(),
  inDeployment: joi.string(),
  inDeployment__in: joi.string().custom(inConditional), // inConditional converts common-delimited string to array.
  // if you ever allow the __exists conditional then make sure it doesn't allow unauthenticed users access to get observations from restricted deployments.
  ancestorPlatforms: joi.string().custom(ancestorPlatformConditional), // for an exact match, e.g. west-school.weather-station-1 TODO: could also allow something like west-school.weather-station-1.* for a lquery style filter.
  ancestorPlatforms__includes: joi.string().custom(kebabCaseValidation), // platform occurs anywhere in path, e.g. west-school
  resultTime__gt: joi.string().isoDate(),
  resultTime__gte: joi.string().isoDate(),
  resultTime__lt: joi.string().isoDate(),
  resultTime__lte: joi.string().isoDate().default((): string => new Date().toISOString()),
  flags__exists: joi.boolean(),
  // spatial queries
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
  onePer: joi.string().valid('sensor', 'timeseries'),
  sortBy: joi.string().valid('timeseries', 'resultTime').default('resultTime'),
  sortOrder: joi.string().valid('asc', 'desc').default('desc')
  // TODO: Provide a way of omitting some of the properties to save data, e.g. if they asked for discipline=meteorology then we could exclude the discipline property. Maybe have a query string parameter such as `lean=true`.
})
.and('proximityCentre', 'proximityRadius')
.without('inDeployment', 'inDeployment__in')
.without('resultTime__gt', 'resultTime__gte')
.without('resultTime__lt', 'resultTime__lte');


router.get('/observations', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getObservationsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  if (check.assigned(query.proximityCentre)) {
    query.proximity = {
      centre: query.proximityCentre,
      radius: query.proximityRadius
    };
    delete query.proximityCentre;
    delete query.proximityRadius;
  }

  // Pull out the options
  const optionKeys = ['limit', 'offset', 'onePer', 'sortBy', 'sortOrder'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = omit(query, optionKeys);
  const where = convertQueryToWhere(wherePart);

  const jsonResponse = await getObservations(where, options, req.user);

  const currentQuerystring = queryObjectToQueryString(query);

  jsonResponse.meta.current = {
    '@id': `${config.api.base}/observations?${currentQuerystring}`
  };
  jsonResponse.meta.current = Object.assign({}, jsonResponse.meta.current, query);

  // Because the observations table could be massive, and it could take some time to count the total number of observation, we take a quick and dirty approach here to working out whether there's likely to be any more observations available
  const isNext = jsonResponse.member.length === query.limit;
  const isPrevious = query.offset !== 0;

  if (isNext) {
    const nextQuery = cloneDeep(query);
    nextQuery.offset = nextQuery.offset + nextQuery.limit;
    const nextQuerystring = queryObjectToQueryString(nextQuery);
    jsonResponse.meta.next = {
      '@id': `${config.api.base}/observations?${nextQuerystring}`
    };
    jsonResponse.meta.next = Object.assign({}, jsonResponse.meta.next, nextQuery);
  }

  if (isPrevious) {
    const previousQuery = cloneDeep(query);
    previousQuery.offset = Math.max(previousQuery.offset - previousQuery.limit, 0);
    const previousQuerystring = queryObjectToQueryString(previousQuery);
    jsonResponse.meta.previous = {
      '@id': `${config.api.base}/observations?${previousQuerystring}`
    };
    jsonResponse.meta.previous = Object.assign({}, jsonResponse.meta.previous, previousQuery);
  }

  return res.json(jsonResponse);

}));



//-------------------------------------------------
// Get observation
//-------------------------------------------------
router.get('/observations/:observationId', asyncWrapper(async (req, res): Promise<any> => {

  const observationId = req.params.observationId;

  const jsonResponse = await getObservation(observationId, req.user);
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Create Observation
//-------------------------------------------------
const createObservationBodySchema = joi.object({
  madeBySensor: joi.string().required(),
  // Don't want inDeployment or isHostedBy being provided here, as this should be derived from any saved context instead.
  hasResult: joi.object({
    value: joi.any().required(),
    unit: joi.string()
  }).required(),
  resultTime: joi.string()
    .isoDate()
    .required(),
  observedProperty: joi.string(),
  usedProcedures: joi.array().items(joi.string())
  // for now at least the discipline and hasFeatureOfInterest should come from the saved context.
})
.required();

// This endpoint is more for superusers. If I ever want to allow standard users to contribute observation then it should be via an endpoint that includes the deployment ID in the url. 
router.post('/observations', asyncWrapper(async (req, res): Promise<any> => {

  // TODO: Replace this with a JSON Schema validation
  const {error: queryErr, value: body} = createObservationBodySchema.validate(req.body);
  if (queryErr) throw new InvalidObservation(queryErr.message);

  const jsonResponse = await createObservation(body, req.user);
  return res.status(201).json(jsonResponse);

}));



//-------------------------------------------------
// Delete Observation
//-------------------------------------------------
// This endpoint is for superusers. If users of a deployment want to delete observations from one of their deployments then they must do this via DELETE /deployments/:deploymentId/observations/:observationId.
router.delete('/observation/:observationId', asyncWrapper(async (req, res): Promise<any> => {

  const observationId = req.params.observationId;
  await deleteObservation(observationId, req.user);
  return res.status(204).send();

}));

