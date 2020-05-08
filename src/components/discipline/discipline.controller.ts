import {CollectionOptions} from '../common/collection-options.class';
import * as disciplineService from './discipline.service';
import {createDisciplineResponse, createDisciplinesResponse} from './discipline.formatter';
import {ApiUser} from '../common/api-user.class';
import {permissionsCheck} from '../common/permissions-check';
import {cloneDeep} from 'lodash';
import {Forbidden} from '../../errors/Forbidden';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import * as check from 'check-types';
import {buildVocabResourceOrArray} from '../common/vocab-resource.helpers';
import {getDeployment} from '../deployment/deployment.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';



export async function createDiscipline(discipline, user: ApiUser): Promise<any> {

  // Eventually we might want to allow standard users to create their own disciplines (in which case we'd need to make sure they're not allowed to specify the 'id'). I'd also need to make sure that if they included 'belongsToDeployment', that they had sufficient rights to that deployment, e.g. maybe only allow admins or engineers to do this. For now however, let's only allow superusers to create disciplines.
  permissionsCheck(user, 'crud:vocab-resources');

  const disciplineToCreate = cloneDeep(discipline);
  if (user.id) {
    disciplineToCreate.createdBy = user.id;
  }

  const createdDeployment = await disciplineService.createDiscipline(disciplineToCreate);
  const disciplineWithContext = createDisciplineResponse(createdDeployment);
  return disciplineWithContext;

}


export async function getDiscipline(disciplineId: string, user: ApiUser): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('crud:vocab-resources');
  const hasAdminRightsToAllDeployments = user.permissions.includes('admin-all:deployments');

  // Get this discipline
  const discipline = await disciplineService.getDiscipline(disciplineId);

  let hasRights = true;
  if (!hasSuperUserPermission && discipline.listed === false) {
    if (discipline.belongsToDeployment) {
      if (!hasAdminRightsToAllDeployments) {
        // Check if the user has rights to this deployment
        const [deploymentLevel] = await getLevelsForDeployments([discipline.belongsToDeployment], user.id);
        if (!deploymentLevel || check.not.notEmptyString(deploymentLevel.level)) {
          hasRights = false;
        }
      }
    } else {
      // They can see it if they created it when it doesn't belong to a deployment
      if (discipline.createdBy && discipline.createBy !== user.id) {
        hasRights = false;
      }
    }
  }
  if (!hasRights) {
    throw new Forbidden('You do not have the rights to view this discipline.');
  }

  const disciplineWithContext = createDisciplineResponse(discipline);
  return disciplineWithContext;

}


export async function getDisciplines(where, options: CollectionOptions, user: ApiUser): Promise<any> {

  const orArray = await buildVocabResourceOrArray(user);
  if (orArray.length > 0) {
    where.or = orArray;
  }

  const {disciplines, count, total} = await disciplineService.getDisciplines(where, options);
  const disciplinesWithContext = createDisciplinesResponse(disciplines, {count, total});
  return disciplinesWithContext;

}



export async function updateDiscipline(disciplineId: string, updates: any, user: ApiUser): Promise<any> {

  const canUpdateAnything = user.permissions.includes('crud:vocab-resouces');

  // Let's get the discipline
  const discipline = await disciplineService.getDiscipline(disciplineId);

  const createdByThisUser = discipline.createdBy && discipline.createdBy === user.id;

  if (!canUpdateAnything && !createdByThisUser) {
    if (discipline.belongsToDeployment) {
      const deployment = await getDeployment(discipline.belongsToDeployment);
      deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
    } else {
      throw new Forbidden('You do not have the rights to update this discipline.');
    }
  }

  if (check.nonEmptyString(updates.belongsToDeployment)) {
    // Check the new deployment exists
    const newDeployment = await getDeployment(updates.belongsToDeployment);
    // And that the user has rights to it.
    deploymentLevelCheck(newDeployment, user, ['admin', 'engineer']);
  }

  const updatedDiscipline = await disciplineService.updateDiscipline(disciplineId, updates);
  const disciplineWithContext = createDisciplineResponse(updatedDiscipline);
  return disciplineWithContext;

}


export async function deleteDiscipline(disciplineId: string, user: ApiUser): Promise<void> {

  const canDeleteAnything = user.permissions.includes('crud:vocab-resouces');

  // Let's get the discipline
  const discipline = await disciplineService.getDiscipline(disciplineId);

  const createdByThisUser = discipline.createdBy && discipline.createdBy === user.id;

  if (!canDeleteAnything && !createdByThisUser) {
    if (discipline.belongsToDeployment) {
      const deployment = await getDeployment(discipline.belongsToDeployment);
      deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
    } else {
      throw new Forbidden('You do not have the rights to delete this discipline.');
    }
  }

  await disciplineService.deleteDiscipline(disciplineId);
  return;

}
