import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {InsufficientDeploymentRights} from '../../errors/InsufficientDeploymentRights';
import {InvalidPlatform} from './errors/InvalidPlatform';
import {createPlatform, getPlatforms, getPlatform} from './platform.controller';
import {validateGeometry} from '../../utils/geojson-validator';
import {InvalidGeometry} from '../../utils/InvalidGeometry';
import * as check from 'check-types';


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
  static: joi.boolean()
    .default(true),
  geometry: joi.object()
    .when('static', {is: true, then: joi.object().required()}),
  isHostedBy: joi.string()
})
.required();

router.post('/deployments/:deploymentId/platforms', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;

  const sufficientRightLevels = ['admin'];
  if (!sufficientRightLevels.includes(req.deploymentRightLevel)) {
    throw new InsufficientDeploymentRights(`To create a platform you must have sufficient rights to the deployment (i.e. ${sufficientRightLevels.join(', ')}). Your level: ${req.deploymentRightLevel}.`);
  }

  const {error: bodyErr, value: body} = joi.validate(req.body, createPlatformBodySchema);
  if (bodyErr) throw new InvalidPlatform(bodyErr.message);

  // Check the geometry is valid geojson geometry
  if (check.assigned(body.geometry)) {
    validateGeometry(body.geometry); // throws InvalidGeometry error if invalid.
  }

  body.inDeployment = deploymentId;

  const createdPlatform = await createPlatform(body);
  return res.status(201).json(createdPlatform);

}));


//-------------------------------------------------
// Get Single Platform
//-------------------------------------------------
router.get('/deployments/:deploymentId/platforms/:platformId', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  const platformId = req.params.platformId;

  const platforms = await getPlatform(platformId, deploymentId);
  return res.json(platforms);

}));



//-------------------------------------------------
// Get Deployment's Platforms
//-------------------------------------------------
router.get('/deployments/:deploymentId/platforms', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;

  const platforms = await getPlatforms({inDeployment: deploymentId});
  return res.json(platforms);

}));