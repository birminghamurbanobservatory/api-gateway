import {CollectionOptions} from '../common/collection-options.class';
import * as usedProcedureService from './used-procedure.service';
import {createUsedProcedureResponse, createUsedProceduresResponse} from './used-procedure.formatter';
import {ApiUser} from '../common/api-user.class';
import {permissionsCheck} from '../common/permissions-check';
import {cloneDeep} from 'lodash';
import {Forbidden} from '../../errors/Forbidden';
import {getLevelsForDeployments} from '../deployment/deployment-users.service';
import * as check from 'check-types';


export async function createUsedProcedure(usedProcedure, user: ApiUser): Promise<any> {

  // Eventually we might want to allow standard users to create their own usedProcedures (in which case we need to make sure they're not allow to specify the 'id'), but for now let's only allow superusers.
  permissionsCheck(user, 'crud:vocab-resources');

  const usedProcedureToCreate = cloneDeep(usedProcedure);
  if (user.id) {
    usedProcedureToCreate.createdBy = user.id;
  }

  const createdDeployment = await usedProcedureService.createUsedProcedure(usedProcedureToCreate);
  const usedProcedureWithContext = createUsedProcedureResponse(createdDeployment);
  return usedProcedureWithContext;

}


export async function getUsedProcedure(usedProcedureId: string, user: ApiUser): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('crud:vocab-resources');
  const hasAdminRightsToAllDeployments = user.permissions.includes('admin-all:deployments');

  // Get this used procedure
  const usedProcedure = await usedProcedureService.getUsedProcedure(usedProcedureId);

  let hasRights = true;
  if (!hasSuperUserPermission && usedProcedure.listed === false) {
    if (usedProcedure.belongsToDeployment) {
      if (!hasAdminRightsToAllDeployments) {
        // Check if the user has rights to this deployment
        const [deploymentLevel] = await getLevelsForDeployments([usedProcedure.belongsToDeployment], user.id);
        if (!deploymentLevel || check.not.notEmptyString(deploymentLevel.level)) {
          hasRights = false;
        }
      }
    } else {
      // They can see it if they created it when it doesn't belong to a deployment
      if (usedProcedure.createdBy && usedProcedure.createBy !== user.id) {
        hasRights = false;
      }
    }
  }
  if (!hasRights) {
    throw new Forbidden('You do not have the rights to view this used procedure.');
  }

  const usedProcedureWithContext = createUsedProcedureResponse(usedProcedure);
  return usedProcedureWithContext;

}


export async function getUsedProcedures(where, options: CollectionOptions, user: ApiUser): Promise<any> {

  // Could potentially simplify this:
  // For all users default to just returning those that are listed.
  // Basic unauthenicated users can only ever get this default reponse.
  // However the following can do more
  // ** Authenticated users
  // - Can ask for just those that they have created (mineOnly = true).
  // - Can ask for just those from a certain deployment(s) (assuming they have rights to this deployment(s))
  // ** Admin-all users
  // - Can ask for just those from a certain deployment(s) with no need to check rights
  // - Can ask for just those that they created (mineOnly = true)
  // ** Superusers
  // - Same as for admin-all expect they can also set listed=false in order to get all those that the other users cannot see.
  // Not convinced this is the most elegant solution.

  // Better solution?!?
  // It's like I need to pass the sensor-deployment-manager an array with the parts of the venn diagram I want it to get, e.g.
  // ['listed', 'mine', 'belongingToDeployments', 'unlisted']
  // If mine is present then a user id will need to be provided
  // If belongToDeployments is provided then either a single or multiple deployment ids will need to be provided.
  // This basically just offsets the problem to the service in the sensor-deployment-manager, with the hope that it's a little easier to construct the query there.

  // The 'search' should hopefully only apply to the selected parts of the venn diagram.

  const {usedProcedures, count, total} = await usedProcedureService.getUsedProcedures(where, options);
  const usedProceduresWithContext = createUsedProceduresResponse(usedProcedures, {count, total});
  return usedProceduresWithContext;

}