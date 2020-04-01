import * as platformService from './platform.service';
import {formatPlatformForClient, addContextToPlatform, addContextToPlatforms} from './platform.formatter';
import {getDeployment, getDeployments} from '../deployment/deployment.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import {Forbidden} from '../../errors/Forbidden';
import {ApiUser} from '../common/api-user.class';
import * as check from 'check-types';
import {pick, concat, uniqBy, cloneDeep} from 'lodash';
import * as Promise from 'bluebird';


export async function createPlatform(platform, user): Promise<any> {

  // Check the have a sufficient access level to the deployment
  const deployment = await getDeployment(platform.ownerDeployment);
  deploymentLevelCheck(deployment, user, ['admin', 'engineer']);

  const createdPlatform = await platformService.createPlatform(platform);
  const platformForClient = formatPlatformForClient(createdPlatform);
  const platformWithContext = addContextToPlatform(platformForClient);
  return platformWithContext;

}


export async function getPlatform(platformId: string, user): Promise<any> {

  const platform = await platformService.getPlatform(platformId);

  let hasSufficientRights;
  const hasSuperUserPermission = user.permissions.includes('admin-all:deployments');
  
  if (hasSuperUserPermission) {
    hasSufficientRights = true;
  } else {

    // We need to check that the platform belongs to a deployment that the user has at least basic rights to.
    let deploymentLevels;
    if (user.id) {
      deploymentLevels = await getLevelsForDeployments(platform.inDeployments, user.id);
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

  if (!hasSufficientRights) {
    throw new Forbidden(`You do not have the rights to access platform '${platformId}'`);
  }

  const platformForClient = formatPlatformForClient(platform);
  const platformWithContext = addContextToPlatform(platformForClient);
  return platformWithContext;

}


export async function getPlatforms(where: {inDeployment?: any; isHostedBy: any; ancestorPlatforms: any}, user: ApiUser): Promise<any> {

  const updatedWhere: any = cloneDeep(where);

  // N.B. there's no point in having a special 'get:platforms' permission, 'admin-all:deployments' is enough, because I can't see a use case where a specific super user would want to get every platform, but not have access to any other information about the deployment.
  const hasSuperUserPermission = user.permissions.includes('admin-all:deployments');

  //------------------------
  // inDeployment specified
  //------------------------
  // If inDeployment has been specified then check that the user has rights to these deployment(s).
  if (where.inDeployment && !hasSuperUserPermission) {

    const deploymentIdsToCheck = check.string(where.inDeployment) ? [where.inDeployment] : where.inDeployment.in;

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
      usersDeployments = await getDeployments({user: user.id});
    }
    publicDeployments = await getDeployments({public: true});
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

  const platforms = await platformService.getPlatforms(updatedWhere);
  const platformsForClient = platforms.map(formatPlatformForClient);
  const platformsWithContext = addContextToPlatforms(platformsForClient);
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

  const platformForClient = formatPlatformForClient(updatedPlatform);
  const platformWithContext = addContextToPlatform(platformForClient);
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



