import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {InsufficientDeploymentRights} from '../../errors/InsufficientDeploymentRights';
import {InvalidPlatform} from './errors/InvalidPlatform';
import {createPlatform, getPlatforms, getPlatform, formatPlatformForClient} from './platform.controller';
import {validateGeometry} from '../../utils/geojson-validator';
import * as check from 'check-types';
import {PlatformNotFound} from './errors/PlatformNotFound';


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
  location: joi.object(),
  isHostedBy: joi.string()
})
.required();

router.post('/deployments/:deploymentId/platforms', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;

  const sufficientRightLevels = ['admin'];
  if (!sufficientRightLevels.includes(req.user.deploymentLevel)) {
    throw new InsufficientDeploymentRights(`To create a platform you must have sufficient rights to the deployment (i.e. ${sufficientRightLevels.join(', ')}). Your level: ${req.user.deploymentLevel}.`);
  }

  const {error: bodyErr, value: body} = createPlatformBodySchema.validate(req.body);
  if (bodyErr) throw new InvalidPlatform(bodyErr.message);

  // Check the location is valid geojson geometry
  if (check.assigned(body.location)) {
    try {
      validateGeometry(body.location); // throws InvalidGeometry error if invalid.
    } catch (err) {
      throw new InvalidPlatform(`Invalid location. Reason: ${err.message}`);
    }
  }

  body.ownerDeployment = deploymentId;

  const createdPlatform = await createPlatform(body);
  const createdPlatformForClient = formatPlatformForClient(createdPlatform);
  return res.status(201).json(createdPlatformForClient);

}));


//-------------------------------------------------
// Get Single Platform
//-------------------------------------------------
router.get('/deployments/:deploymentId/platforms/:platformId', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  const platformId = req.params.platformId;

  const platform = await getPlatform(platformId);
  if (!platform.inDeployments.includes(deploymentId)) {
    throw new PlatformNotFound(`Platform '${platformId}' does not belong to the deployment '${deploymentId}'.`);
  }

  const platformForClient = formatPlatformForClient(platform);
  return res.json(platformForClient);

}));



//-------------------------------------------------
// Get Deployment's Platforms
//-------------------------------------------------
router.get('/deployments/:deploymentId/platforms', asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;

  const platforms = await getPlatforms({inDeployment: deploymentId});

  const platformsForClient = platforms.map(formatPlatformForClient);
  return res.json(platformsForClient);

}));