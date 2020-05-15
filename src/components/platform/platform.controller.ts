import * as platformService from './platform.service';
import {formatForClientAndAddContextToPlatformWithHostsArray, createPlatformsResponse, createPlatformResponse, formatForClientAndAddContextToNestedPlatforms} from './platform.formatter';
import {getDeployment, getDeployments} from '../deployment/deployment.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import {Forbidden} from '../../errors/Forbidden';
import {ApiUser} from '../common/api-user.class';
import * as check from 'check-types';
import {omit, concat, uniqBy, cloneDeep} from 'lodash';
import * as Promise from 'bluebird';
import {recursivelyExtractInDeploymentIds, recursivelyRemoveProtectedHostedPlatforms} from './platform.helpers';
import * as logger from 'node-logger';
import {CollectionOptions} from '../common/collection-options.class';


export async function createPlatform(platform, user): Promise<any> {

  // Check the have a sufficient access level to the deployment
  const deployment = await getDeployment(platform.inDeployment);
  deploymentLevelCheck(deployment, user, ['admin', 'engineer']);

  if (platform.location && platform.location.geometry.coordinates.length === 3) {
    // the sensor-deployment-manager handles the height separately to the lat and lon.
    platform.location.height = platform.location.geometry.coordinates.pop();
  }

  const createdPlatform = await platformService.createPlatform(platform);
  const platformWithContext = createPlatformResponse(createdPlatform);
  return platformWithContext;

}


export async function getPlatform(platformId: string, user, options: {nest?: boolean} = {}): Promise<any> {

  const platform = await platformService.getPlatform(platformId, options);

  let hasSufficientRights;
  const hasSuperUserPermission = user.permissions.includes('admin-all:deployments');
  let platformSafeForUser;

  if (hasSuperUserPermission) {
    hasSufficientRights = true;
    platformSafeForUser = platform;

  } else {

    let deploymentsIdsForLevelChecking;
    if (platform.hosts) {
      deploymentsIdsForLevelChecking = recursivelyExtractInDeploymentIds(platform);
    } else {
      deploymentsIdsForLevelChecking = [platform.inDeployment];
    }

    let deploymentLevels;
    if (user.id) {
      deploymentLevels = await getLevelsForDeployments(deploymentsIdsForLevelChecking, user.id);
    } else {
      deploymentLevels = await getLevelsForDeployments(deploymentsIdsForLevelChecking);
    }

    // We need to check that the (top-level) platform belongs to a deployment that the user has at least basic rights to.
    let hasRightsToTopLevelPlatformsDeployment;
    const topLevelPlatformDeploymentLevel = deploymentLevels.find((deploymentLevel): boolean => {
      return deploymentLevel.deploymentId === platform.inDeployment;
    });
    if (topLevelPlatformDeploymentLevel && Boolean(topLevelPlatformDeploymentLevel.level)) {
      hasRightsToTopLevelPlatformsDeployment = true;
    }

    if (hasRightsToTopLevelPlatformsDeployment) {
      hasSufficientRights = true;
    }

    // We'll want to remove any hosted platforms that this user doesn't have rights too.
    const safeDeploymentIds = deploymentLevels
      .filter((deploymentLevel): boolean => Boolean(deploymentLevel.level))
      .map((deploymentLevel): string => deploymentLevel.deploymentId);
    logger.debug(safeDeploymentIds);
    logger.debug(platform);
    platformSafeForUser = platform.hosts ? recursivelyRemoveProtectedHostedPlatforms(platform, safeDeploymentIds) : platform;
    logger.debug(platformSafeForUser);

  }

  if (!hasSufficientRights) {
    throw new Forbidden(`You do not have the rights to access platform '${platformId}'`);
  }

  let platformWithContext;
  if (platform.hosts) {
    platformWithContext = formatForClientAndAddContextToPlatformWithHostsArray(platformSafeForUser);
  } else {
    platformWithContext = createPlatformResponse(platformSafeForUser);
  }
  return platformWithContext;

}


class GetPlatformsOptions extends CollectionOptions {
  public nest?: boolean;
}

export async function getPlatforms(where: {inDeployment?: any; isHostedBy: any; ancestorPlatforms: any; search?: string; latitude?: any; longitude?: any}, options: GetPlatformsOptions, user: ApiUser): Promise<any> {

  const updatedWhere: any = cloneDeep(where);

  // N.B. there's no point in having a special 'get:platforms' permission, 'admin-all:deployments' is enough, because I can't see a use case where a specific super user would want to get every platform, but not have access to any other information about the deployment. Also platforms can't exists outside of a deployment.
  const hasSuperUserPermission = user.permissions.includes('admin-all:deployments');

  //------------------------
  // inDeployment specified
  //------------------------
  // If inDeployment has been specified then check that the user has rights to these deployment(s).
  if (where.inDeployment && !hasSuperUserPermission) {

    // TODO: You'll need to update this if you allow filtering by more than one deployment
    const deploymentIdsToCheck = [where.inDeployment];

    let deploymentLevels;
    if (user.id) {
      // N.b. this should error if any of the deployments don't exist
      deploymentLevels = await getLevelsForDeployments(deploymentIdsToCheck, user.id);
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
    if (user.id) {
      const response = await getDeployments({user: user.id});
      usersDeployments = response.deployments;
    }
    const response = await getDeployments({public: true});
    publicDeployments = response.deployments;
    const combindedDeployments = concat(usersDeployments, publicDeployments);
    const uniqueDeployments = uniqBy(combindedDeployments, 'id');
    if (uniqueDeployments.length === 0) {
      throw new Forbidden('You do not have access to any deployments and therefore its not possible to retrieve any platforms.');
    }
    const deploymentIds = uniqueDeployments.map((deployment): string => deployment.id);
    updatedWhere.inDeployment = {
      in: deploymentIds
    };

  }

  if (hasSuperUserPermission) {
    // TODO: if the request was for specific deployment then might want to check the deployments actually exist?
  }

  if (where.ancestorPlatforms) {
    updatedWhere.hostedByPath = where.ancestorPlatforms;
  }
  delete updatedWhere.ancestorPlatforms;

  // Make a bounding box out of the latitude and longitude (if available)
  if (check.nonEmptyObject(where.latitude) && check.nonEmptyObject(where.longitude)) {
    updatedWhere.boundingBox = {
      left: where.longitude.gte,
      right: where.longitude.lte,
      top: where.latitude.lte,
      bottom: where.latitude.gte
    };
    delete updatedWhere.latitude;
    delete updatedWhere.longitude;
  }

  const {platforms, count, total} = await platformService.getPlatforms(updatedWhere, options);

  let platformsWithContext;
  if (options.nest) {
    platformsWithContext = formatForClientAndAddContextToNestedPlatforms(platforms, {count, total});
  } else {
    platformsWithContext = createPlatformsResponse(platforms, {count, total});
  }

  return platformsWithContext;

}


export async function updatePlatform(platformId: string, updates: any, user: ApiUser): Promise<any> {

  const platform = await platformService.getPlatform(platformId);

  const itsDeployment = await getDeployment(platform.inDeployment);
  deploymentLevelCheck(itsDeployment, user, ['admin', 'engineer']);
  

  if (updates.isHostedBy) {

    let hasRightsToHostPlatform;

    // Get the new host platform so we can check the user has rights to a deployment it's in
    const hostPlatform = await platformService.getPlatform(updates.isHostedBy);

    // Chances are the platform will be in this same deployment, so let's quickly check this first.
    if (hostPlatform.inDeployment === itsDeployment.id) {
      hasRightsToHostPlatform = true;

    } else {

      // We need to get these deployments to see if they're public or ones that this user has access to.
      const hostPlatformDeployment = await getDeployment(hostPlatform.id);

      if (hostPlatformDeployment.public === true) {
        hasRightsToHostPlatform = true;
        const userIds = hostPlatformDeployment.users.map((user): string => user.id);
        if (userIds.includes(user.id)) {
          hasRightsToHostPlatform = true;
        }
      }

      if (!hasRightsToHostPlatform) {
        throw new Forbidden(`You do not have sufficient rights to platform '${updates.isHostedBy}' in order to host ${platformId} on it.`);
      }

    }

    // Rehost the platform
    await platformService.rehostPlatform(platformId, updates.isHostedBy);

  }

  // Unhost a platform
  if (updates.isHostedBy === null) {
    await platformService.unhostPlatform(platformId);
  }

  const basicUpdates = omit(updates, ['isHostedBy']);

  if (basicUpdates.location && basicUpdates.location.geometry.coordinates.length === 3) {
    // the sensor-deployment-manager handles the height separately to the lat and lon.
    basicUpdates.location.height = basicUpdates.location.geometry.coordinates.pop();
  }

  let updatedPlatform;
  if (Object.keys(basicUpdates).length > 0) {
    updatedPlatform = await platformService.updatePlatform(platformId, basicUpdates);
  } else {
    updatedPlatform = await platformService.getPlatform(platformId); 
  }

  const platformWithContext = createPlatformResponse(updatedPlatform);
  return platformWithContext;
}


export async function deletePlatform(platformId: string, user: ApiUser): Promise<void> {

  const platform = await platformService.getPlatform(platformId);

  let inDeployment;
  if (!user.permissions || !user.permissions.includes('admin-all:deployments')) {
    inDeployment = await getDeployment(platform.inDeployment);
    deploymentLevelCheck(inDeployment, user, ['admin', 'engineer']);
  }

  await platformService.deletePlatform(platformId);

  return;
}



export async function releasePlatformSensors(platformId: string, user: ApiUser): Promise<void> {

  const platform = await platformService.getPlatform(platformId);

  let inDeployment;
  if (!user.permissions || !user.permissions.includes('admin-all:deployments')) {
    inDeployment = await getDeployment(platform.inDeployment);
    deploymentLevelCheck(inDeployment, user, ['admin', 'engineer']);
  }

  await platformService.releasePlatformSensors(platformId);
  return;

}




