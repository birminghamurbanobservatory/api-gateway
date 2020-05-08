import {CollectionOptions} from '../common/collection-options.class';
import * as aggregationService from './aggregation.service';
import {createAggregationResponse, createAggregationsResponse} from './aggregation.formatter';
import {ApiUser} from '../common/api-user.class';
import {permissionsCheck} from '../common/permissions-check';
import {cloneDeep} from 'lodash';
import {Forbidden} from '../../errors/Forbidden';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import * as check from 'check-types';
import {buildVocabResourceOrArray} from '../common/vocab-resource.helpers';
import {getDeployment} from '../deployment/deployment.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';



export async function createAggregation(aggregation, user: ApiUser): Promise<any> {

  // Eventually we might want to allow standard users to create their own aggregations (in which case we'd need to make sure they're not allowed to specify the 'id'). I'd also need to make sure that if they included 'belongsToDeployment', that they had sufficient rights to that deployment, e.g. maybe only allow admins or engineers to do this. For now however, let's only allow superusers to create aggregations.
  permissionsCheck(user, 'crud:vocab-resources');

  const aggregationToCreate = cloneDeep(aggregation);
  if (user.id) {
    aggregationToCreate.createdBy = user.id;
  }

  const createdDeployment = await aggregationService.createAggregation(aggregationToCreate);
  const aggregationWithContext = createAggregationResponse(createdDeployment);
  return aggregationWithContext;

}


export async function getAggregation(aggregationId: string, user: ApiUser): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('crud:vocab-resources');
  const hasAdminRightsToAllDeployments = user.permissions.includes('admin-all:deployments');

  // Get this aggregation
  const aggregation = await aggregationService.getAggregation(aggregationId);

  let hasRights = true;
  if (!hasSuperUserPermission && aggregation.listed === false) {
    if (aggregation.belongsToDeployment) {
      if (!hasAdminRightsToAllDeployments) {
        // Check if the user has rights to this deployment
        const [deploymentLevel] = await getLevelsForDeployments([aggregation.belongsToDeployment], user.id);
        if (!deploymentLevel || check.not.notEmptyString(deploymentLevel.level)) {
          hasRights = false;
        }
      }
    } else {
      // They can see it if they created it when it doesn't belong to a deployment
      if (aggregation.createdBy && aggregation.createBy !== user.id) {
        hasRights = false;
      }
    }
  }
  if (!hasRights) {
    throw new Forbidden('You do not have the rights to view this aggregation.');
  }

  const aggregationWithContext = createAggregationResponse(aggregation);
  return aggregationWithContext;

}


export async function getAggregations(where, options: CollectionOptions, user: ApiUser): Promise<any> {

  const orArray = await buildVocabResourceOrArray(user);
  if (orArray.length > 0) {
    where.or = orArray;
  }

  const {aggregations, count, total} = await aggregationService.getAggregations(where, options);
  const aggregationsWithContext = createAggregationsResponse(aggregations, {count, total});
  return aggregationsWithContext;

}



export async function updateAggregation(aggregationId: string, updates: any, user: ApiUser): Promise<any> {

  const canUpdateAnything = user.permissions.includes('crud:vocab-resouces');

  // Let's get the aggregation
  const aggregation = await aggregationService.getAggregation(aggregationId);

  const createdByThisUser = aggregation.createdBy && aggregation.createdBy === user.id;

  if (!canUpdateAnything && !createdByThisUser) {
    if (aggregation.belongsToDeployment) {
      const deployment = await getDeployment(aggregation.belongsToDeployment);
      deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
    } else {
      throw new Forbidden('You do not have the rights to update this aggregation.');
    }
  }

  if (check.nonEmptyString(updates.belongsToDeployment)) {
    // Check the new deployment exists
    const newDeployment = await getDeployment(updates.belongsToDeployment);
    // And that the user has rights to it.
    deploymentLevelCheck(newDeployment, user, ['admin', 'engineer']);
  }

  const updatedAggregation = await aggregationService.updateAggregation(aggregationId, updates);
  const aggregationWithContext = createAggregationResponse(updatedAggregation);
  return aggregationWithContext;

}


export async function deleteAggregation(aggregationId: string, user: ApiUser): Promise<void> {

  const canDeleteAnything = user.permissions.includes('crud:vocab-resouces');

  // Let's get the aggregation
  const aggregation = await aggregationService.getAggregation(aggregationId);

  const createdByThisUser = aggregation.createdBy && aggregation.createdBy === user.id;

  if (!canDeleteAnything && !createdByThisUser) {
    if (aggregation.belongsToDeployment) {
      const deployment = await getDeployment(aggregation.belongsToDeployment);
      deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
    } else {
      throw new Forbidden('You do not have the rights to delete this aggregation.');
    }
  }

  await aggregationService.deleteAggregation(aggregationId);
  return;

}
