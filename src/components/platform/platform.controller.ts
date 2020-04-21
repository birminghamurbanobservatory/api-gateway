import * as platformService from './platform.service';
import {formatForClientAndAddContextToPlatformWithHostsArray, createPlatformsResponse, createPlatformResponse, formatForClientAndAddContextToNestedPlatforms} from './platform.formatter';
import {getDeployment, getDeployments} from '../deployment/deployment.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import {Forbidden} from '../../errors/Forbidden';
import {ApiUser} from '../common/api-user.class';
import * as check from 'check-types';
import {pick, concat, uniqBy, cloneDeep} from 'lodash';
import * as Promise from 'bluebird';
import {recursivelyExtractInDeploymentIds, recursivelyRemoveProtectedHostedPlatforms} from './platform.helpers';
import * as logger from 'node-logger';
import {PaginationOptions} from '../common/pagination-options.class';


export async function createPlatform(platform, user): Promise<any> {

  // Check the have a sufficient access level to the deployment
  const deployment = await getDeployment(platform.ownerDeployment);
  deploymentLevelCheck(deployment, user, ['admin', 'engineer']);

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
      deploymentsIdsForLevelChecking = platform.inDeployments;
    }

    let deploymentLevels;
    if (user.id) {
      deploymentLevels = await getLevelsForDeployments(deploymentsIdsForLevelChecking, user.id);
    } else {
      deploymentLevels = await getLevelsForDeployments(deploymentsIdsForLevelChecking);
    }

    // We need to check that the (top-level) platform belongs to a deployment that the user has at least basic rights to.
    const hasRightsToAtLeastOneDeployment = platform.inDeployments.some((deploymentId): boolean => {
      const matchingDeployment = deploymentLevels.find((deploymentLevel): any => deploymentLevel.deploymentId === deploymentId);
      return matchingDeployment && Boolean(matchingDeployment.level);
    }); 

    if (hasRightsToAtLeastOneDeployment) {
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


class GetPlatformsOptions extends PaginationOptions {
  public nest?: boolean;
}

export async function getPlatforms(where: {inDeployments?: any; isHostedBy: any; ancestorPlatforms: any}, options: GetPlatformsOptions, user: ApiUser): Promise<any> {

  const updatedWhere: any = cloneDeep(where);

  // N.B. there's no point in having a special 'get:platforms' permission, 'admin-all:deployments' is enough, because I can't see a use case where a specific super user would want to get every platform, but not have access to any other information about the deployment.
  const hasSuperUserPermission = user.permissions.includes('admin-all:deployments');

  //------------------------
  // inDeployment specified
  //------------------------
  // If inDeployment has been specified then check that the user has rights to these deployment(s).
  if (where.inDeployments && !hasSuperUserPermission) {

    // TODO: You'll need to update this if you allow filtering by more than one deployment
    const deploymentIdsToCheck = [where.inDeployments.includes];

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
  if (!where.inDeployments && !hasSuperUserPermission) {

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

  const {platforms, count, total} = await platformService.getPlatforms(where, options);

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

  const ownerDeployment = await getDeployment(platform.ownerDeployment);
  if (!user.permissions.includes('admin-all:deployments')) {
    deploymentLevelCheck(ownerDeployment, user, ['admin', 'engineer']);
  }

  if (updates.isHostedBy) {

    let hasRightsToHostPlatform;

    // Get the new host platform so we can check the user has rights to a deployment its in
    const hostPlatform = await platformService.getPlatform(updates.isHostedBy);

    // Chances are the platform will be in this same deployment, so let's quickly check this first.
    if (hostPlatform.inDeployments.includes(ownerDeployment.id)) {
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
        if (userIds.includes(user.id)) {
          hasRightsToHostPlatform = true;
        }
      });

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

  const basicUpdates = pick(updates, ['name', 'description', 'static']);
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

  let ownerDeployment;
  if (!user.permissions || !user.permissions.includes('admin-all:deployments')) {
    ownerDeployment = await getDeployment(platform.ownerDeployment);
    deploymentLevelCheck(ownerDeployment, user, ['admin', 'engineer']);
  }

  await platformService.deletePlatform(platformId);

  return;
}



export async function releasePlatformSensors(platformId: string, user: ApiUser): Promise<void> {

  const platform = await platformService.getPlatform(platformId);

  let ownerDeployment;
  if (!user.permissions || !user.permissions.includes('admin-all:deployments')) {
    ownerDeployment = await getDeployment(platform.ownerDeployment);
    deploymentLevelCheck(ownerDeployment, user, ['admin', 'engineer']);
  }

  await platformService.releasePlatformSensors(platformId);
  return;

}




