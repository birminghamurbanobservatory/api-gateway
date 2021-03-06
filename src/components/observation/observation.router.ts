//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import * as logger from 'node-logger';
import {getObservations, getObservation, deleteObservation, createObservation, updateObservation} from './observation.controller';
import {InvalidObservation} from './errors/InvalidObservation';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {pick, cloneDeep, omit} from 'lodash';
import {Promise} from 'bluebird';
import {stringArrayConditional, ancestorPlatformConditional, kebabCaseValidation, proximityCentreConditional, populateObservationConditional} from '../../utils/custom-joi-validations';
import {config} from '../../config';
import {queryObjectToQueryString} from '../../utils/query-object-to-querystring';
import * as check from 'check-types';
import {addMetaLinks} from '../common/add-meta-links';
import {validateAgainstSchema} from '../schemas/json-schema-validator';
import {validateGeometry} from '../../utils/geojson-validator';
import {alphanumericPlusHyphenRegex} from '../../utils/regular-expressions';
import {InvalidBody} from '../../errors/InvalidBody';

const router = express.Router();

export {router as ObservationRouter};


//-------------------------------------------------
// Get observations
//-------------------------------------------------
const getObservationsQuerySchema = joi.object({
  // filtering
  valueType: joi.string().valid('number', 'text', 'boolean', 'json'),
  valueType__in: joi.string().custom(stringArrayConditional),
  madeBySensor: joi.string().pattern(alphanumericPlusHyphenRegex),
  madeBySensor__in: joi.string().custom(stringArrayConditional),
  inTimeseries: joi.string().alphanum(), // catches any accidental commas that might be present
  inTimeseries__in: joi.string().custom(stringArrayConditional),
  inTimeseries__not__in: joi.string().custom(stringArrayConditional),
  observedProperty: joi.string().pattern(alphanumericPlusHyphenRegex),
  aggregation: joi.string().pattern(alphanumericPlusHyphenRegex),
  aggregation__in: joi.string().custom(stringArrayConditional),
  unit: joi.string().pattern(alphanumericPlusHyphenRegex),
  unit__in: joi.string().custom(stringArrayConditional),
  unit__exists: joi.boolean(),
  hasFeatureOfInterest: joi.string().pattern(alphanumericPlusHyphenRegex),
  disciplines: joi.string().custom(stringArrayConditional), // an exact match, comma-separated. Can provide disciplines in any order, they will be sorted by the observations-manager before querying against the alphabetical database record.
  disciplines__not: joi.string().custom(stringArrayConditional), // exludes the exact match
  disciplines__includes: joi.string(),
  // TODO: Add a disciplines__not__includes?
  hasDeployment: joi.string().pattern(alphanumericPlusHyphenRegex), // catches any accidental commas that might be present
  hasDeployment__in: joi.string().custom(stringArrayConditional), // stringArrayConditional converts common-delimited string to array.
  hasDeployment__not: joi.string().pattern(alphanumericPlusHyphenRegex),
  hasDeployment__not__in: joi.string().custom(stringArrayConditional),
  // if you ever allow the __exists conditional then make sure it doesn't allow unauthenticed users access to get observations from restricted deployments.
  ancestorPlatforms: joi.string().custom(ancestorPlatformConditional), // for an exact match, e.g. west-school.weather-station-1 TODO: could also allow something like west-school.weather-station-1.* for a lquery style filter.
  ancestorPlatforms__includes: joi.string().custom(kebabCaseValidation), // platform occurs anywhere in path, e.g. west-school
  resultTime__gt: joi.string().isoDate(),
  resultTime__gte: joi.string().isoDate(),
  resultTime__lt: joi.string().isoDate(),
  resultTime__lte: joi.string().isoDate(),
  duration: joi.number().min(0),
  duration__lt: joi.number().min(0),
  duration__lte: joi.number().min(0),
  duration__gt: joi.number().min(0),
  duration__gte: joi.number().min(0),
  flags__exists: joi.boolean(),
  location__exists: joi.boolean(),
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
  populate: joi.string().custom(populateObservationConditional),
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  onePer: joi.string().valid('sensor', 'timeseries'),
  sortBy: joi.string().valid('timeseries', 'resultTime').default('resultTime'),
  sortOrder: joi.string().valid('asc', 'desc').default('desc')
  // TODO: Provide a way of omitting some of the properties to save data, e.g. if they asked for discipline=meteorology then we could exclude the discipline property. Maybe have a query string parameter such as `lean=true`.
})
.and('proximityCentre', 'proximityRadius')
.oxor('hasDeployment', 'hasDeployment__in', 'hasDeployment__not', 'hasDeployment__not__in')
.without('resultTime__gt', 'resultTime__gte')
.without('resultTime__lt', 'resultTime__lte')
.without('duration__lt', 'duration__lte')
.without('duration__gt', 'duration__gte')
.oxor('inTimeseries', 'inTimeseries__in', 'inTimeseries__not__in')
.without('valueType', 'valueType__in');


router.get('/observations', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getObservationsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

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
  const optionKeys = ['limit', 'offset', 'onePer', 'sortBy', 'sortOrder', 'populate'];
  const options: any = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = omit(query, optionKeys);
  const where = convertQueryToWhere(wherePart);

  let jsonResponse = await getObservations(where, options, req.user);
  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/observations`, query);
  validateAgainstSchema(jsonResponse, 'observations-get-response-body');
  return res.json(jsonResponse);

}));



//-------------------------------------------------
// Get observation
//-------------------------------------------------
const getObservationQuerySchema = joi.object({
  populate: joi.string().custom(populateObservationConditional)
});

router.get('/observations/:observationId', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: options} = getObservationQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  const observationId = req.params.observationId;
  const jsonResponse = await getObservation(observationId, options, req.user);
  validateAgainstSchema(jsonResponse, 'observation-get-response-body');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Create Observation
//-------------------------------------------------
const createObservationBodySchema = joi.object({
  madeBySensor: joi.string().required(),
  // Don't want hasDeployment or isHostedBy being provided here, as this should be derived from any saved context instead.
  hasResult: joi.object({
    value: joi.any().required(),
    unit: joi.string()
  }).required(),
  resultTime: joi.string()
    .isoDate()
    .required(),
  observedProperty: joi.string(),
  aggregation: joi.string(),
  usedProcedures: joi.array().items(joi.string()),
  // for now at least the discipline and hasFeatureOfInterest should come from the saved context.
  location: joi.object({
    id: joi.string(),
    height: joi.number(), // TODO: move this into a properties object?
    geometry: joi.object({
      // Decide I only ever want platforms to be Points
      type: joi.string().valid('Point').required(),
      coordinates: joi.array().min(2).max(3).required() // TODO: drop this to just 2 coordinates?
    })
    .custom((value): any => {
      validateGeometry(value); // throws an error if invalid
      return value;
    })
    .required()
  })
})
.required();

// This endpoint is more for superusers. If I ever want to allow standard users to contribute observation then it should be via an endpoint that includes the deployment ID in the url. 
router.post('/observations', asyncWrapper(async (req, res): Promise<any> => {

  // TODO: Replace this with a JSON Schema validation
  const {error: queryErr, value: body} = createObservationBodySchema.validate(req.body);
  if (queryErr) throw new InvalidObservation(queryErr.message);

  const jsonResponse = await createObservation(body, req.user);
  validateAgainstSchema(jsonResponse, 'observation-get-response-body');
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Update observation
//-------------------------------------------------
const observationUpdateBodySchema = joi.object({
  hasResult: joi.object({
    // Provide a value of null when you want all flags removing.
    flags: joi.array().allow(null).min(1).items(joi.string())
    // TODO: only allow certain flags to be added by the user?
  }).min(1)
})
.min(1)
.required();
// TODO: Use a JSON schema instead.

const updateObservationQuerySchema = joi.object({
  populate: joi.string().custom(populateObservationConditional)
});

router.patch('/observations/:observationId', asyncWrapper(async (req, res): Promise<any> => {

  const observationId = req.params.observationId;

  const {error: bodyErr, value: updates} = observationUpdateBodySchema.validate(req.body);
  if (bodyErr) throw new InvalidBody(bodyErr.message);

  const {error: queryErr, value: options} = updateObservationQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  const jsonResponse = await updateObservation(observationId, updates, options, req.user);
  validateAgainstSchema(jsonResponse, 'observation-get-response-body');
  return res.json(jsonResponse);

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

