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

const router = express.Router();

export {router as PlatformRouter};


//-------------------------------------------------
// Create Platform
//-------------------------------------------------
const createPlatformBodySchema = joi.object({
  id: joi.string(),
  name: joi.string()
    .required(),
  description: joi.string(),
  ownerDeployment: joi.string().required(),
  static: joi.boolean()
    .default(true),
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
  isHostedBy: joi.string()
  // N.B. ownerDeployment is not allowed in here, this must come from the url
})
.required();

router.post('/platforms', asyncWrapper(async (req, res): Promise<any> => {

  const {error: bodyErr, value: body} = createPlatformBodySchema.validate(req.body);
  if (bodyErr) throw new InvalidPlatform(bodyErr.message);

  const jsonResponse = await createPlatform(body, req.user);
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
  inDeployment: joi.string(),
  inDeployment__in: joi.string().custom(inConditional),
  isHostedBy__exists: joi.boolean()
  // TODO: Add the option to exclude platforms in public deployments that are not the user's deployment.
})
.without('inDeployment', 'inDeployment__in');


router.get('/platforms', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getPlatformsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  const where = convertQueryToWhere(query);

  const jsonResponse = await getPlatforms(where, req.user);
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
  isHostedBy: joi.string().allow(),
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

