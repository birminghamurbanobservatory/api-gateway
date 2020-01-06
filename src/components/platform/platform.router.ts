import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {InsufficientDeploymentRights} from '../../errors/InsufficientDeploymentRights';
import {InvalidPlatform} from './errors/InvalidPlatform';
import {createPlatform, getPlatforms, getPlatform, formatPlatformForClient, updatePlatform, rehostPlatform} from './platform.controller';
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
  location: joi.object(),
  isHostedBy: joi.string()
})
.required();

router.post('/deployments/:deploymentId/platforms', deploymentLevelCheck(['admin']), asyncWrapper(async (req, res): Promise<any> => {

  // TODO: I can see two options for how to register a platform that's being created from a permanent host to a deployment.
  // 1. We use this endpoint, and if the body contains {registrationKey: 'awuegfnwie'} then we generate the platform from our permanentHost. You could let the user add some more properties at this point too.
  // 2. We create a new endpoint, e.g. /deployments/register to which a body of {registrationKey: 'awuegfnwie'} can be posted. The benefit of this approach is that if we start allowing individual sensors to be added via a registration key (i.e. not just sensors bound to permanent hosts) then we can use this same endpoint for both sensors and permanenent host.

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



//-------------------------------------------------
// Update a platform
//-------------------------------------------------
const updatePlatformBodySchema = joi.object({
  name: joi.string(),
  description: joi.string(),
  static: joi.boolean(),
  isHostedBy: joi.string()
  // TODO: Allow the location to be updated here? Probably only want to allow this for static platforms.
})
.min(1)
.required();

router.patch('/deployments/:deploymentId/platforms/:platformId', deploymentLevelCheck(['admin']), asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: body} = updatePlatformBodySchema.validate(req.body);
  if (queryErr) throw new InvalidPlatformUpdates(queryErr.message);

  const deploymentId = req.params.deploymentId;
  const platformId = req.params.platformId;

  // Check the platform actually belongs to this deployment
  const platform = await getPlatform(platformId);
  if (!platform.inDeployments.includes(deploymentId)) {
    throw new PlatformNotFound(`Platform '${platformId}' does not belong to the deployment '${deploymentId}'.`);
  }

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