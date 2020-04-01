import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {InvalidPlatform} from './errors/InvalidPlatform';
import {createPlatform, getPlatforms, getPlatform, updatePlatform, deletePlatform, releasePlatformSensors} from './platform.controller';
import {validateGeometry} from '../../utils/geojson-validator';
import {InvalidPlatformUpdates} from './errors/InvalidPlatformUpdates';
import * as Promise from 'bluebird';
import {inConditional} from '../../utils/custom-joi-validations';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {validateAgainstSchema} from '../schemas/json-schema-validator';

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
router.get(`/platforms/:platformId`, asyncWrapper(async (req, res): Promise<any> => {

  const platformId = req.params.platformId;
  logger.debug(`Request to get platform ${platformId}`);
  const jsonResponse = await getPlatform(platformId, req.user);
  res.set('Content-Type', 'application/ld+json');
  return res.json(jsonResponse);

}));


//-------------------------------------------------
// Get Platforms (bypassing deployment)
//-------------------------------------------------
const getPlatformsQuerySchema = joi.object({
  id__begins: joi.string(),
  inDeployment: joi.string(),
  inDeployment__in: joi.string().custom(inConditional),
  isHostedBy: joi.string(), // For exact match of direct host, e.g. west-school
  isHostedBy__in: joi.string().custom(inConditional), // Find platforms with a direct host in the comma-separated list provided e.g. west-school,east-school
  isHostedBy__exists: joi.boolean(), // find platforms not hosted by any others, i.e. top-level platforms
  ancestorPlatforms__includes: joi.string(), // platform occurs anywhere in path, e.g. west-school
  // TODO: Possible future additions:
  // 1. ancestorPlatforms__includes__in
  // 2. ancestorPlatforms=west-school.weather-station-1.*, i.e. postgresql lquery format. Would also use this for find an exact match of the whole path. N.b. however my MongoDB array approach doesn't support lquery style queries out of the box, so it would require a bit of code writting to further filter database results.
  // TODO: Add the option to exclude platforms in public deployments that are not the user's deployment.
})
.without('inDeployment', 'inDeployment__in');


router.get('/platforms', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getPlatformsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  const where = convertQueryToWhere(query);

  const jsonResponse = await getPlatforms(where, req.user);
  validateAgainstSchema(jsonResponse, 'platforms-get-response-body');
  res.set('Content-Type', 'application/ld+json');
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
  res.set('Content-Type', 'application/ld+json');
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

