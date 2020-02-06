import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {InsufficientDeploymentRights} from '../../errors/InsufficientDeploymentRights';
import {InvalidPlatform} from './errors/InvalidPlatform';
import {createPlatform, getPlatforms, getPlatform, formatPlatformForClient, updatePlatform, rehostPlatform, deletePlatform} from './platform.controller';
import {validateGeometry} from '../../utils/geojson-validator';
import * as check from 'check-types';
import {PlatformNotFound} from './errors/PlatformNotFound';
import {deploymentLevelCheck} from '../../routes/middleware/deployment-level';
import {InvalidPlatformUpdates} from './errors/InvalidPlatformUpdates';
import * as Promise from 'bluebird';
import {getDeployment} from '../deployment/deployment.controller';
import {Forbidden} from '../../errors/Forbidden';
import {pick} from 'lodash';


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
})
.required();

router.post('/deployments/:deploymentId/platforms', deploymentLevelCheck(['admin']), asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;

  const sufficientRightLevels = ['admin'];
  if (!sufficientRightLevels.includes(req.user.deploymentLevel)) {
    throw new InsufficientDeploymentRights(`To create a platform you must have sufficient rights to the deployment (i.e. ${sufficientRightLevels.join(', ')}). Your level: ${req.user.deploymentLevel}.`);
  }

  const {error: bodyErr, value: body} = createPlatformBodySchema.validate(req.body);
  if (bodyErr) throw new InvalidPlatform(bodyErr.message);

  body.ownerDeployment = deploymentId;

  const createdPlatform = await createPlatform(body);
  const createdPlatformForClient = formatPlatformForClient(createdPlatform);
  return res.status(201).json(createdPlatformForClient);

}));


//-------------------------------------------------
// For any specific platform requests
//-------------------------------------------------
router.use('/deployments/:deploymentId/platforms/:platformId', asyncWrapper(async (req, res, next): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  const platformId = req.params.platformId;

  // Get the platform to check it actually exists
  const platform = await getPlatform(platformId);

  // Check the platform actually belongs to this deployment
  if (!platform.inDeployments.includes(deploymentId)) {
    throw new PlatformNotFound(`Platform '${platformId}' does not belong to the deployment '${deploymentId}'.`);
  }

  logger.debug(`Platform ${platformId} has been confirmed as belonging to deployment ${deploymentId}`);

  req.platform = platform;

  next();

}));



//-------------------------------------------------
// Get Single Platform
//-------------------------------------------------
router.get('/deployments/:deploymentId/platforms/:platformId', asyncWrapper(async (req, res): Promise<any> => {

  // The platform has already been got in the .use middleware.
  const platformForClient = formatPlatformForClient(req.platform);
  return res.json(platformForClient);

}));


//-------------------------------------------------
// Get Platforms
//-------------------------------------------------
router.get('/platforms', asyncWrapper(async (req, res): Promise<any> => {
  // TODO: This will need to work much like the /observations endpoint, in that you'll first have to work out which deployments this user has access to. If they have special rights then it will be all of them. The special right here should probably be 'admin-all:deployments' rather than trying to create some special 'get:platforms' permission, as a platform has to always belong to to a deployment, and I can't see a use case where a specific user would want to get every platform, but not have access to any other information about the deployment.
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



//-------------------------------------------------
// Update a platform
//-------------------------------------------------
const updatePlatformBodySchema = joi.object({
  name: joi.string(),
  description: joi.string(),
  static: joi.boolean(),
  isHostedBy: joi.string(),
  // TODO: Allow the location to be updated here? Probably only want to allow this for static platforms.
  updateLocationWithSensor: joi.string()
    .when('static', {is: true, then: joi.forbidden()}),
})
.min(1)
.required();

router.patch('/deployments/:deploymentId/platforms/:platformId', deploymentLevelCheck(['admin']), asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: body} = updatePlatformBodySchema.validate(req.body);
  if (queryErr) throw new InvalidPlatformUpdates(queryErr.message);

  const deploymentId = req.params.deploymentId;
  const platformId = req.params.platformId;

  if (body.isHostedBy) {

    let hasRightsToHostPlatform;

    // Get the new host platform so we can check the user has rights to a deployment its in
    const hostPlatform = await getPlatform(body.isHostedBy);

    // Chances are the platform will be in this same deployment, so let's quickly check this first.
    if (hostPlatform.inDeployments.includes(deploymentId)) {
      hasRightsToHostPlatform = true;

    } else {

      // We need to get these deployments to see if they're public or ones that this user has access to.
      const hostDeployments = await Promise.map(hostPlatform.inDeployments, async (hostDeploymentId): Promise<any> => {
        return await getDeployment(hostDeploymentId); 
      });

      hostDeployments.forEach((hostDeployment): void => {
        if (hostDeployment.public === true) {
          hasRightsToHostPlatform = true;
        }
        const userIds = hostDeployment.users.map((user): string => user.id);
        if (userIds.includes(req.user.id)) {
          hasRightsToHostPlatform = true;
        }
      });

      if (!hasRightsToHostPlatform) {
        throw new Forbidden(`You do not have sufficient rights to platform '${body.isHostedBy}' in order to host ${platformId} on it.`);
      }

    }

    // Rehost the platform
    await rehostPlatform(platformId, body.isHostedBy);

  }

  const basicUpdates = pick(body, ['name', 'description', 'static']);
  const updatedPlatform = await updatePlatform(platformId, basicUpdates);
  const platformforClient = formatPlatformForClient(updatedPlatform);
  return res.json(platformforClient);

}));


//-------------------------------------------------
// Delete Platform
//-------------------------------------------------
router.delete('/deployments/:deploymentId/platforms/:platformId', deploymentLevelCheck(['admin']), asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  const platformId = req.params.platformId;  

  // Check that this deployment owns this platfrom and therefore has the rights to delete it.
  if (req.platform.ownerDeployment !== deploymentId) {
    throw new Forbidden(`The platform '${platformId}' is owned by the deployment '${req.platform.ownerDeployment}' not '${deploymentId}'. Only the deployment that owns it can delete it.`);
  }

  await deletePlatform(platformId);
  return res.status(204).send();

}));