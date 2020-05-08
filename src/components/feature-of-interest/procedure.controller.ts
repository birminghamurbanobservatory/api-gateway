import {CollectionOptions} from '../common/collection-options.class';
import * as featureOfInterestService from './feature-of-interest.service';
import {createFeatureOfInterestResponse, createFeaturesOfInterestResponse} from './feature-of-interest.formatter';
import {ApiUser} from '../common/api-user.class';
import {permissionsCheck} from '../common/permissions-check';
import {cloneDeep} from 'lodash';
import {Forbidden} from '../../errors/Forbidden';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import * as check from 'check-types';
import {buildVocabResourceOrArray} from '../common/vocab-resource.helpers';
import {getDeployment} from '../deployment/deployment.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';



export async function createFeatureOfInterest(featureOfInterest, user: ApiUser): Promise<any> {

  // Eventually we might want to allow standard users to create their own featuresOfInterest (in which case we'd need to make sure they're not allowed to specify the 'id'). I'd also need to make sure that if they included 'belongsToDeployment', that they had sufficient rights to that deployment, e.g. maybe only allow admins or engineers to do this. For now however, let's only allow superusers to create featuresOfInterest.
  permissionsCheck(user, 'crud:vocab-resources');

  const featureOfInterestToCreate = cloneDeep(featureOfInterest);
  if (user.id) {
    featureOfInterestToCreate.createdBy = user.id;
  }

  const createdDeployment = await featureOfInterestService.createFeatureOfInterest(featureOfInterestToCreate);
  const featureOfInterestWithContext = createFeatureOfInterestResponse(createdDeployment);
  return featureOfInterestWithContext;

}


export async function getFeatureOfInterest(featureOfInterestId: string, user: ApiUser): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('crud:vocab-resources');
  const hasAdminRightsToAllDeployments = user.permissions.includes('admin-all:deployments');

  // Get this featureOfInterest
  const featureOfInterest = await featureOfInterestService.getFeatureOfInterest(featureOfInterestId);

  let hasRights = true;
  if (!hasSuperUserPermission && featureOfInterest.listed === false) {
    if (featureOfInterest.belongsToDeployment) {
      if (!hasAdminRightsToAllDeployments) {
        // Check if the user has rights to this deployment
        const [deploymentLevel] = await getLevelsForDeployments([featureOfInterest.belongsToDeployment], user.id);
        if (!deploymentLevel || check.not.notEmptyString(deploymentLevel.level)) {
          hasRights = false;
        }
      }
    } else {
      // They can see it if they created it when it doesn't belong to a deployment
      if (featureOfInterest.createdBy && featureOfInterest.createBy !== user.id) {
        hasRights = false;
      }
    }
  }
  if (!hasRights) {
    throw new Forbidden('You do not have the rights to view this feature of interest.');
  }

  const featureOfInterestWithContext = createFeatureOfInterestResponse(featureOfInterest);
  return featureOfInterestWithContext;

}


export async function getFeaturesOfInterest(where, options: CollectionOptions, user: ApiUser): Promise<any> {

  const orArray = await buildVocabResourceOrArray(user);
  if (orArray.length > 0) {
    where.or = orArray;
  }

  const {featuresOfInterest, count, total} = await featureOfInterestService.getFeaturesOfInterest(where, options);
  const featuresOfInterestWithContext = createFeaturesOfInterestResponse(featuresOfInterest, {count, total});
  return featuresOfInterestWithContext;

}



export async function updateFeatureOfInterest(featureOfInterestId: string, updates: any, user: ApiUser): Promise<any> {

  const canUpdateAnything = user.permissions.includes('crud:vocab-resouces');

  // Let's get the featureOfInterest
  const featureOfInterest = await featureOfInterestService.getFeatureOfInterest(featureOfInterestId);

  const createdByThisUser = featureOfInterest.createdBy && featureOfInterest.createdBy === user.id;

  if (!canUpdateAnything && !createdByThisUser) {
    if (featureOfInterest.belongsToDeployment) {
      const deployment = await getDeployment(featureOfInterest.belongsToDeployment);
      deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
    } else {
      throw new Forbidden('You do not have the rights to update this feature of interest.');
    }
  }

  if (check.nonEmptyString(updates.belongsToDeployment)) {
    // Check the new deployment exists
    const newDeployment = await getDeployment(updates.belongsToDeployment);
    // And that the user has rights to it.
    deploymentLevelCheck(newDeployment, user, ['admin', 'engineer']);
  }

  const updatedFeatureOfInterest = await featureOfInterestService.updateFeatureOfInterest(featureOfInterestId, updates);
  const featureOfInterestWithContext = createFeatureOfInterestResponse(updatedFeatureOfInterest);
  return featureOfInterestWithContext;

}


export async function deleteFeatureOfInterest(featureOfInterestId: string, user: ApiUser): Promise<void> {

  const canDeleteAnything = user.permissions.includes('crud:vocab-resouces');

  // Let's get the featureOfInterest
  const featureOfInterest = await featureOfInterestService.getFeatureOfInterest(featureOfInterestId);

  const createdByThisUser = featureOfInterest.createdBy && featureOfInterest.createdBy === user.id;

  if (!canDeleteAnything && !createdByThisUser) {
    if (featureOfInterest.belongsToDeployment) {
      const deployment = await getDeployment(featureOfInterest.belongsToDeployment);
      deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
    } else {
      throw new Forbidden('You do not have the rights to delete this feature of interest.');
    }
  }

  await featureOfInterestService.deleteFeatureOfInterest(featureOfInterestId);
  return;

}
