import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as joi from '@hapi/joi';
import * as logger from 'node-logger';
import {InsufficientDeploymentRights} from '../../errors/InsufficientDeploymentRights';
import {InvalidPlatform} from './errors/InvalidPlatform';
import {createPlatform, getPlatforms, getPlatform, formatPlatformForClient, updatePlatform, rehostPlatform, deletePlatform, releasePlatformSensors} from './platform.controller';
import {validateGeometry} from '../../utils/geojson-validator';
import * as check from 'check-types';
import {PlatformNotFound} from './errors/PlatformNotFound';
import {deploymentLevelCheck} from '../../routes/middleware/deployment-level';
import {InvalidPlatformUpdates} from './errors/InvalidPlatformUpdates';
import * as Promise from 'bluebird';
import {getDeployment, getDeployments} from '../deployment/deployment.controller';
import {Forbidden} from '../../errors/Forbidden';
import {pick, concat, uniqBy} from 'lodash';
import {inConditional} from '../../utils/custom-joi-validations';
import {InvalidQueryString} from '../../errors/InvalidQueryString';
import {convertQueryToWhere} from '../../utils/query-to-where-converter';
import {getLevelsForDeployments} from '../deployment/deployment-users.controller';


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
// Get single platform (bypassing deployment)
//-------------------------------------------------
// This just makes it a little easier to get access to a platform without having to know exactly which of the deployments the platform belongs to is one that you have rights to.
router.get(`/platforms/:platformId`, asyncWrapper(async (req, res): Promise<any> => {

  const platformId = req.params.platformId;
  const userId = req.user.id;
  const hasSuperUserPermission = req.user.permissions && req.user.permissions.includes('admin-all:deployments');
  let hasSufficientRights;

  logger.debug(`Request to get platform ${platformId}`);

  // Get the platform
  const platform = await getPlatform(platformId);

  if (hasSuperUserPermission) {
    hasSufficientRights = true; 

  } else {

    let deploymentLevels;
    if (userId) {
      // N.b. this should error if any of the deployments don't exist
      deploymentLevels = await getLevelsForDeployments(platform.inDeployments, userId);
    } else {
      deploymentLevels = await getLevelsForDeployments(platform.inDeployments);
    }

    const hasRightsToAtLeastOneDeployment = deploymentLevels.some((deploymentLevel): boolean => {
      return Boolean(deploymentLevel.level);
    }); 

    if (hasRightsToAtLeastOneDeployment) {
      hasSufficientRights = true;
    }

  }

  if (hasSufficientRights) {
    const platformForClient = formatPlatformForClient(platform);
    return res.json(platformForClient);
  } else {
    throw new Forbidden(`You do not have the rights to access platform '${platformId}'`);
  }

}));


//-------------------------------------------------
// Get Platforms
//-------------------------------------------------
const getPlatformsQuerySchema = joi.object({
  inDeployment: joi.string(),
  inDeployment_in: joi.string().custom(inConditional),
})
.without('inDeployment', 'inDeployment__in');


router.get('/platforms', asyncWrapper(async (req, res): Promise<any> => {

  const {error: queryErr, value: query} = getPlatformsQuerySchema.validate(req.query);
  if (queryErr) throw new InvalidQueryString(queryErr.message);

  const where = convertQueryToWhere(query);

  const userId = req.user.id;
  const hasSuperUserPermission = req.user.permissions && req.user.permissions.includes('admin-all:deployments');
  // N.B. there's no point in having a special 'get:platforms' permission, 'admin-all:deployments' is enough, because I can't see a use case where a specific super user would want to get every platform, but not have access to any other information about the deployment.

  //------------------------
  // inDeployment specified
  //------------------------
  // If inDeployment has been specified then check that the user has rights to these deployment(s).
  if (where.inDeployment && !hasSuperUserPermission) {

    const deploymentIdsToCheck = check.string(where.inDeployment) ? [check.string(where.inDeployment)] : where.inDeployment.in;

    let deploymentLevels;
    if (userId) {
      // N.b. this should error if any of the deployments don't exist
      deploymentLevels = await getLevelsForDeployments(deploymentIdsToCheck, userId);
    } else {
      deploymentLevels = await getLevelsForDeployments(deploymentIdsToCheck);
    }

    // If there's no level defined for any of these deployments then throw an error
    deploymentLevels.forEach((deploymentLevel): void => {
      if (!deploymentLevel.level) {
        throw new Forbidden(`You do not have the rights to access platforms from the deployment '${deploymentLevel.deploymentId}'.`);
      }
    });
    
  }

  //------------------------
  // inDeployment unspecified
  //------------------------
  // If no deployment has been specified then get a list of all the public deployments and the user's own deployments.
  if (!where.inDeployment && !hasSuperUserPermission) {

    let usersDeployments = [];
    let publicDeployments = [];
    if (req.user.id) {
      usersDeployments = await getDeployments({user: req.user.id});
    }
    publicDeployments = await getDeployments({public: true});
    const combindedDeployments = concat(usersDeployments, publicDeployments);
    const uniqueDeployments = uniqBy(combindedDeployments, 'id');
    if (uniqueDeployments.length === 0) {
      throw new Forbidden('You do not have access to any deployments and therefore its not possible to retrieve any platforms.');
    }
    const deploymentIds = uniqueDeployments.map((deployment): string => deployment.id);
    where.inDeployment = {
      in: deploymentIds
    };

  }

  if (hasSuperUserPermission) {
    // TODO: if the request was for specific deployments then might want to check the deployments actually exist?
  }

  // Quick safety check to make sure non-super users can't go retrieving platforms without their deployments being defined.
  if (!hasSuperUserPermission && (!where.inDeployment && !where.inDeployment__in)) {
    throw new Error(' A non-super user is able to request platforms without specifying deployments. Code needs editing to fix this.');
  }

  const platforms = await getPlatforms(where);
  const platformsForClient = platforms.map(formatPlatformForClient);
  return res.json(platformsForClient);

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

  // Check that this deployment owns this platform and therefore has the rights to update it.
  if (req.platform.ownerDeployment !== deploymentId) {
    throw new Forbidden(`The platform '${platformId}' is owned by the deployment '${req.platform.ownerDeployment}' not '${deploymentId}'. Only the deployment that owns it can update it.`);
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


//-------------------------------------------------
// Delete Platform
//-------------------------------------------------
router.delete('/deployments/:deploymentId/platforms/:platformId', deploymentLevelCheck(['admin']), asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  const platformId = req.params.platformId;  

  // Check that this deployment owns this platform and therefore has the rights to delete it.
  if (req.platform.ownerDeployment !== deploymentId) {
    throw new Forbidden(`The platform '${platformId}' is owned by the deployment '${req.platform.ownerDeployment}' not '${deploymentId}'. Only the deployment that owns it can delete it.`);
  }

  await deletePlatform(platformId);
  return res.status(204).send();

}));


//-------------------------------------------------
// Release a Platform's Sensors
//-------------------------------------------------
// For when a user wants to release all sensors directly hosted on a platform, whilst keeping a record of the platform in the deployment.
router.delete('/deployments/:deploymentId/platforms/:platformId/sensors', deploymentLevelCheck(['admin', 'engineer']), asyncWrapper(async (req, res): Promise<any> => {

  const deploymentId = req.params.deploymentId;
  const platformId = req.params.platformId;

  // Check that this deployment owns this platform and therefore has the rights to update it.
  if (req.platform.ownerDeployment !== deploymentId) {
    throw new Forbidden(`The platform '${platformId}' is owned by the deployment '${req.platform.ownerDeployment}' not '${deploymentId}'. Only the deployment that owns it can release its sensors.`);
  }

  await releasePlatformSensors(platformId);

  return res.status(204).send();

}));

