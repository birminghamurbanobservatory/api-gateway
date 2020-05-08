import {CollectionOptions} from '../common/collection-options.class';
import * as procedureService from './procedure.service';
import {createProcedureResponse, createProceduresResponse} from './procedure.formatter';
import {ApiUser} from '../common/api-user.class';
import {permissionsCheck} from '../common/permissions-check';
import {cloneDeep} from 'lodash';
import {Forbidden} from '../../errors/Forbidden';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import * as check from 'check-types';
import {buildVocabResourceOrArray} from '../common/vocab-resource.helpers';
import {getDeployment} from '../deployment/deployment.service';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';



export async function createProcedure(procedure, user: ApiUser): Promise<any> {

  // Eventually we might want to allow standard users to create their own procedures (in which case we'd need to make sure they're not allowed to specify the 'id'). I'd also need to make sure that if they included 'belongsToDeployment', that they had sufficient rights to that deployment, e.g. maybe only allow admins or engineers to do this. For now however, let's only allow superusers to create procedures.
  permissionsCheck(user, 'crud:vocab-resources');

  const procedureToCreate = cloneDeep(procedure);
  if (user.id) {
    procedureToCreate.createdBy = user.id;
  }

  const createdDeployment = await procedureService.createProcedure(procedureToCreate);
  const procedureWithContext = createProcedureResponse(createdDeployment);
  return procedureWithContext;

}


export async function getProcedure(procedureId: string, user: ApiUser): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('crud:vocab-resources');
  const hasAdminRightsToAllDeployments = user.permissions.includes('admin-all:deployments');

  // Get this procedure
  const procedure = await procedureService.getProcedure(procedureId);

  let hasRights = true;
  if (!hasSuperUserPermission && procedure.listed === false) {
    if (procedure.belongsToDeployment) {
      if (!hasAdminRightsToAllDeployments) {
        // Check if the user has rights to this deployment
        const [deploymentLevel] = await getLevelsForDeployments([procedure.belongsToDeployment], user.id);
        if (!deploymentLevel || check.not.notEmptyString(deploymentLevel.level)) {
          hasRights = false;
        }
      }
    } else {
      // They can see it if they created it when it doesn't belong to a deployment
      if (procedure.createdBy && procedure.createBy !== user.id) {
        hasRights = false;
      }
    }
  }
  if (!hasRights) {
    throw new Forbidden('You do not have the rights to view this procedure.');
  }

  const procedureWithContext = createProcedureResponse(procedure);
  return procedureWithContext;

}


export async function getProcedures(where, options: CollectionOptions, user: ApiUser): Promise<any> {

  const orArray = await buildVocabResourceOrArray(user);
  if (orArray.length > 0) {
    where.or = orArray;
  }

  const {procedures, count, total} = await procedureService.getProcedures(where, options);
  const proceduresWithContext = createProceduresResponse(procedures, {count, total});
  return proceduresWithContext;

}



export async function updateProcedure(procedureId: string, updates: any, user: ApiUser): Promise<any> {

  const canUpdateAnything = user.permissions.includes('crud:vocab-resouces');

  // Let's get the procedure
  const procedure = await procedureService.getProcedure(procedureId);

  const createdByThisUser = procedure.createdBy && procedure.createdBy === user.id;

  if (!canUpdateAnything && !createdByThisUser) {
    if (procedure.belongsToDeployment) {
      const deployment = await getDeployment(procedure.belongsToDeployment);
      deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
    } else {
      throw new Forbidden('You do not have the rights to update this procedure.');
    }
  }

  if (check.nonEmptyString(updates.belongsToDeployment)) {
    // Check the new deployment exists
    const newDeployment = await getDeployment(updates.belongsToDeployment);
    // And that the user has rights to it.
    deploymentLevelCheck(newDeployment, user, ['admin', 'engineer']);
  }

  const updatedProcedure = await procedureService.updateProcedure(procedureId, updates);
  const procedureWithContext = createProcedureResponse(updatedProcedure);
  return procedureWithContext;

}


export async function deleteProcedure(procedureId: string, user: ApiUser): Promise<void> {

  const canDeleteAnything = user.permissions.includes('crud:vocab-resouces');

  // Let's get the procedure
  const procedure = await procedureService.getProcedure(procedureId);

  const createdByThisUser = procedure.createdBy && procedure.createdBy === user.id;

  if (!canDeleteAnything && !createdByThisUser) {
    if (procedure.belongsToDeployment) {
      const deployment = await getDeployment(procedure.belongsToDeployment);
      deploymentLevelCheck(deployment, user, ['admin', 'engineer']);
    } else {
      throw new Forbidden('You do not have the rights to delete this procedure.');
    }
  }

  await procedureService.deleteProcedure(procedureId);
  return;

}
