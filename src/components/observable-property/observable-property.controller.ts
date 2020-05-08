import {CollectionOptions} from '../common/collection-options.class';
import * as observablePropertyService from './observable-property.service';
import {createObservablePropertyResponse, createObservablePropertiesResponse} from './observable-property.formatter';
import {ApiUser} from '../common/api-user.class';
import {permissionsCheck} from '../common/permissions-check';
import {cloneDeep} from 'lodash';
import {Forbidden} from '../../errors/Forbidden';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import * as check from 'check-types';
import {buildVocabResourceOrArray} from '../common/vocab-resource.helpers';
import {getDeployment} from '../deployment/deployment.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';



export async function createObservableProperty(observableProperty, user: ApiUser): Promise<any> {

  // Eventually we might want to allow standard users to create their own observableProperties (in which case we'd need to make sure they're not allowed to specify the 'id'). I'd also need to make sure that if they included 'belongsToDeployment', that they had sufficient rights to that deployment, e.g. maybe only allow admins or engineers to do this. For now however, let's only allow superusers to create observableProperties.
  permissionsCheck(user, 'crud:vocab-resources');

  const observablePropertyToCreate = cloneDeep(observableProperty);
  if (user.id) {
    observablePropertyToCreate.createdBy = user.id;
  }

  const createdDeployment = await observablePropertyService.createObservableProperty(observablePropertyToCreate);
  const observablePropertyWithContext = createObservablePropertyResponse(createdDeployment);
  return observablePropertyWithContext;

}


export async function getObservableProperty(observablePropertyId: string, user: ApiUser): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('crud:vocab-resources');
  const hasAdminRightsToAllDeployments = user.permissions.includes('admin-all:deployments');

  // Get this observableProperty
  const observableProperty = await observablePropertyService.getObservableProperty(observablePropertyId);

  let hasRights = true;
  if (!hasSuperUserPermission && observableProperty.listed === false) {
    if (observableProperty.belongsToDeployment) {
      if (!hasAdminRightsToAllDeployments) {
        // Check if the user has rights to this deployment
        const [deploymentLevel] = await getLevelsForDeployments([observableProperty.belongsToDeployment], user.id);
        if (!deploymentLevel || check.not.notEmptyString(deploymentLevel.level)) {
          hasRights = false;
        }
      }
    } else {
      // They can see it if they created it when it doesn't belong to a deployment
      if (observableProperty.createdBy && observableProperty.createBy !== user.id) {
        hasRights = false;
      }
    }
  }
  if (!hasRights) {
    throw new Forbidden('You do not have the rights to view this observable property.');
  }

  const observablePropertyWithContext = createObservablePropertyResponse(observableProperty);
  return observablePropertyWithContext;

}


export async function getObservableProperties(where, options: CollectionOptions, user: ApiUser): Promise<any> {

  const orArray = await buildVocabResourceOrArray(user);
  if (orArray.length > 0) {
    where.or = orArray;
  }

  const {observableProperties, count, total} = await observablePropertyService.getObservableProperties(where, options);
  const observablePropertiesWithContext = createObservablePropertiesResponse(observableProperties, {count, total});
  return observablePropertiesWithContext;

}



export async function updateObservableProperty(observablePropertyId: string, updates: any, user: ApiUser): Promise<any> {

  const canUpdateAnything = user.permissions.includes('crud:vocab-resouces');

  // Let's get the observableProperty
  const observableProperty = await observablePropertyService.getObservableProperty(observablePropertyId);

  const createdByThisUser = observableProperty.createdBy && observableProperty.createdBy === user.id;

  if (!canUpdateAnything && !createdByThisUser) {
    if (observableProperty.belongsToDeployment) {
      const deployment = await getDeployment(observableProperty.belongsToDeployment);
      deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
    } else {
      throw new Forbidden('You do not have the rights to update this observable property.');
    }
  }

  if (check.nonEmptyString(updates.belongsToDeployment)) {
    // Check the new deployment exists
    const newDeployment = await getDeployment(updates.belongsToDeployment);
    // And that the user has rights to it.
    deploymentLevelCheck(newDeployment, user, ['admin', 'engineer']);
  }

  const updatedObservableProperty = await observablePropertyService.updateObservableProperty(observablePropertyId, updates);
  const observablePropertyWithContext = createObservablePropertyResponse(updatedObservableProperty);
  return observablePropertyWithContext;

}


export async function deleteObservableProperty(observablePropertyId: string, user: ApiUser): Promise<void> {

  const canDeleteAnything = user.permissions.includes('crud:vocab-resouces');

  // Let's get the observableProperty
  const observableProperty = await observablePropertyService.getObservableProperty(observablePropertyId);

  const createdByThisUser = observableProperty.createdBy && observableProperty.createdBy === user.id;

  if (!canDeleteAnything && !createdByThisUser) {
    if (observableProperty.belongsToDeployment) {
      const deployment = await getDeployment(observableProperty.belongsToDeployment);
      deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
    } else {
      throw new Forbidden('You do not have the rights to delete this observable property.');
    }
  }

  await observablePropertyService.deleteObservableProperty(observablePropertyId);
  return;

}
