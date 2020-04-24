import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {createPlatform, getPlatforms, getPlatform, updatePlatform, deletePlatform, releasePlatformSensors} from './platform.controller';
import {validateGeometry} from '../../utils/geojson-validator';
import {InvalidPlatformUpdates} from './errors/InvalidPlatformUpdates';
import * as Promise from 'bluebird';
import {inConditional} from '../../utils/custom-joi-validations';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {validateAgainstSchema} from '../schemas/json-schema-validator';
import {pick, omit} from 'lodash';
import {addMetaLinks} from '../common/add-meta-links';
import {config} from '../../config';

const router = express.Router();

export {router as PlatformRouter};


//-------------------------------------------------
// Create Platform
//-------------------------------------------------
router.post('/platforms', asyncWrapper(async (req, res): Promise<any> => {

  const body = validateAgainstSchema(req.body, 'platform-create-request-body');
  // Check the geometry separately
  if (body.location) {
    validateGeometry(body.location.geometry);
  }
  const jsonResponse = await createPlatform(body, req.user);
  validateAgainstSchema(jsonResponse, 'platform-get-response-body');
  return res.status(201).json(jsonResponse);

}));


//-------------------------------------------------
// Get platform
//-------------------------------------------------
const getPlatformQuerySchema = joi.object({
  nest: joi.boolean().default(false)
});

router.get(`/platforms/:platformId`, asyncWrapper(async (req, res): Promise<any> => {

  const platformId = req.params.platformId;
  logger.debug(`Request to get platform ${platformId}`);
  const {error: queryErr, value: query} = getPlatformQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);
  const jsonResponse = await getPlatform(platformId, req.user, query);
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Get Platforms
//-------------------------------------------------
const getPlatformsQuerySchema = joi.object({
  id__begins: joi.string(),
  inDeployments__includes: joi.string(),
  isHostedBy: joi.string(), // For exact match of direct host, e.g. west-school
  isHostedBy__in: joi.string().custom(inConditional), // Find platforms with a direct host in the comma-separated list provided e.g. west-school,east-school
  isHostedBy__exists: joi.boolean(), // find platforms not hosted by any others, i.e. top-level platforms
  ancestorPlatforms__includes: joi.string(), // platform occurs anywhere in path, e.g. west-school
  // TODO: Possible future additions:
  // 1. ancestorPlatforms__includes__in
  // 2. ancestorPlatforms=west-school.weather-station-1.*, i.e. postgresql lquery format. Would also use this for find an exact match of the whole path. N.b. however my MongoDB array approach doesn't support lquery style queries out of the box, so it would require a bit of code writting to further filter database results.
  // TODO: Add the option to exclude platforms in public deployments that are not the user's deployment.
  search: joi.string(),
  // options
  nest: joi.boolean().default(false),
  limit: joi.number().integer().positive().max(1000).default(100),
  offset: joi.number().integer().min(0).default(0),
  sortBy: joi.string().valid('id').default('id'),
  sortOrder: joi.string().valid('asc', 'desc').default('asc')
})
.without('inDeployment', 'inDeployment__in');


router.get('/platforms', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getPlatformsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  // Pull out the options
  const optionKeys = ['nest', 'limit', 'offset', 'sortBy', 'sortOrder'];
  const options = pick(query, optionKeys);

  // Pull out the where conditions (let's assume it's everything except the option parameters)
  const wherePart = omit(query, optionKeys);
  const where = convertQueryToWhere(wherePart);

  let jsonResponse = await getPlatforms(where, options, req.user);
  jsonResponse = addMetaLinks(jsonResponse, `${config.api.base}/platforms`, query);
  // TODO: Add this validation back in once it supports nested platforms
  // validateAgainstSchema(jsonResponse, 'platforms-get-response-body');
  return res.json(jsonResponse);

}));




//-------------------------------------------------
// Update a platform
//-------------------------------------------------
const updatePlatformBodySchema = joi.object({
  name: joi.string(),
  description: joi.string(),
  static: joi.boolean(),
  isHostedBy: joi.string().allow(null),
  location: joi.object({
    geometry: joi.object({
      type: joi.string().required(),
      coordinates: joi.array().required()
    })
    .custom((value): any => {
      validateGeometry(value); // throws an error if invalid
      return value;
    })
    .required()
  }),
  updateLocationWithSensor: joi.string().allow(null)
    .when('static', {is: true, then: joi.forbidden()})
})
.min(1)
.required();


router.patch('/platforms/:platformId', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: body} = updatePlatformBodySchema.validate(req.body);
  if (queryErr) throw new InvalidPlatformUpdates(queryErr.message);

  const platformId = req.params.platformId;
  const jsonResponse = await updatePlatform(platformId, body, req.user);
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Delete Platform
//-------------------------------------------------
router.delete('/platforms/:platformId', asyncWrapper(async (req, res): Promise<any> => {

  const platformId = req.params.platformId;  
  await deletePlatform(platformId, req.user);
  return res.status(204).send();

}));


//-------------------------------------------------
// Release a Platform's Sensors
//-------------------------------------------------
// For when a user wants to release all sensors directly hosted on a platform, whilst keeping a record of the platform in the deployment.
router.delete('/platforms/:platformId/sensors', asyncWrapper(async (req, res): Promise<any> => {

  const platformId = req.params.platformId;
  await releasePlatformSensors(platformId, req.user);
  return res.status(204).send();

}));

