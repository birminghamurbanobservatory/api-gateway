import {CollectionOptions} from '../common/collection-options.class';
import * as unitService from './unit.service';
import {createUnitResponse, createUnitsResponse} from './unit.formatter';
import {ApiUser} from '../common/api-user.class';
import {permissionsCheck} from '../common/permissions-check';
import {cloneDeep} from 'lodash';
import {Forbidden} from '../../errors/Forbidden';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import * as check from 'check-types';
import {buildVocabResourceOrArray} from '../common/vocab-resource.helpers';
import {getDeployment} from '../deployment/deployment.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';



export async function createUnit(unit, user: ApiUser): Promise<any> {

  // Eventually we might want to allow standard users to create their own units (in which case we'd need to make sure they're not allowed to specify the 'id'). I'd also need to make sure that if they included 'belongsToDeployment', that they had sufficient rights to that deployment, e.g. maybe only allow admins or engineers to do this. For now however, let's only allow superusers to create units.
  permissionsCheck(user, 'crud:vocab-resources');

  const unitToCreate = cloneDeep(unit);
  if (user.id) {
    unitToCreate.createdBy = user.id;
  }

  const createdDeployment = await unitService.createUnit(unitToCreate);
  const unitWithContext = createUnitResponse(createdDeployment);
  return unitWithContext;

}


export async function getUnit(unitId: string, user: ApiUser): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('crud:vocab-resources');
  const hasAdminRightsToAllDeployments = user.permissions.includes('admin-all:deployments');

  // Get this unit
  const unit = await unitService.getUnit(unitId);

  let hasRights = true;
  if (!hasSuperUserPermission && unit.listed === false) {
    if (unit.belongsToDeployment) {
      if (!hasAdminRightsToAllDeployments) {
        // Check if the user has rights to this deployment
        const [deploymentLevel] = await getLevelsForDeployments([unit.belongsToDeployment], user.id);
        if (!deploymentLevel || check.not.notEmptyString(deploymentLevel.level)) {
          hasRights = false;
        }
      }
    } else {
      // They can see it if they created it when it doesn't belong to a deployment
      if (unit.createdBy && unit.createBy !== user.id) {
        hasRights = false;
      }
    }
  }
  if (!hasRights) {
    throw new Forbidden('You do not have the rights to view this unit.');
  }

  const unitWithContext = createUnitResponse(unit);
  return unitWithContext;

}


export async function getUnits(where, options: CollectionOptions, user: ApiUser): Promise<any> {

  const orArray = await buildVocabResourceOrArray(user);
  if (orArray.length > 0) {
    where.or = orArray;
  }

  const {units, count, total} = await unitService.getUnits(where, options);
  const unitsWithContext = createUnitsResponse(units, {count, total});
  return unitsWithContext;

}



export async function updateUnit(unitId: string, updates: any, user: ApiUser): Promise<any> {

  const canUpdateAnything = user.permissions.includes('crud:vocab-resouces');

  // Let's get the unit
  const unit = await unitService.getUnit(unitId);

  const createdByThisUser = unit.createdBy && unit.createdBy === user.id;

  if (!canUpdateAnything && !createdByThisUser) {
    if (unit.belongsToDeployment) {
      const deployment = await getDeployment(unit.belongsToDeployment);
      deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
    } else {
      throw new Forbidden('You do not have the rights to update this unit.');
    }
  }

  if (check.nonEmptyString(updates.belongsToDeployment)) {
    // Check the new deployment exists
    const newDeployment = await getDeployment(updates.belongsToDeployment);
    // And that the user has rights to it.
    deploymentLevelCheck(newDeployment, user, ['admin', 'engineer']);
  }

  const updatedUnit = await unitService.updateUnit(unitId, updates);
  const unitWithContext = createUnitResponse(updatedUnit);
  return unitWithContext;

}


export async function deleteUnit(unitId: string, user: ApiUser): Promise<void> {

  const canDeleteAnything = user.permissions.includes('crud:vocab-resouces');

  // Let's get the unit
  const unit = await unitService.getUnit(unitId);

  const createdByThisUser = unit.createdBy && unit.createdBy === user.id;

  if (!canDeleteAnything && !createdByThisUser) {
    if (unit.belongsToDeployment) {
      const deployment = await getDeployment(unit.belongsToDeployment);
      deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
    } else {
      throw new Forbidden('You do not have the rights to delete this unit.');
    }
  }

  await unitService.deleteUnit(unitId);
  return;

}
