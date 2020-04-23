import * as deploymentService from './deployment.service';
import {ApiUser} from '../common/api-user.class';
import {WhereItem} from '../common/where-item.class';
import {concat, uniqBy, cloneDeep} from 'lodash';
import {permissionsCheck} from '../common/permissions-check';
import {deploymentLevelCheck} from './deployment-level-check';
import {createDeploymentsResponse, createDeploymentResponse} from './deployment.formatter';
import {PaginationOptions} from '../common/pagination-options.class';
import * as check from 'check-types';


export async function getDeployments(where: {public?: boolean; id?: WhereItem; search?: string}, user: ApiUser, options: any): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('get:deployments');

  let response;
  const updatedWhere = cloneDeep(where);

  //------------------------
  // Superuser
  //------------------------
  if (hasSuperUserPermission) {
    // If they want just their deployments then we'll need to provide their user id and set mineOnly=true
    if (options.mineOnly) {
      updatedWhere.user = user.id;
      options.mineOnly = true;
    }
    response = await deploymentService.getDeployments(updatedWhere, options);

  //------------------------
  // User with credentials
  //------------------------
  } else if (user.id) {
    // Let's set a default for the mineOnly option
    if (check.not.assigned(options.mineOnly)) {
      options.mineOnly = true;
    }
    updatedWhere.user = user.id;
    response = await deploymentService.getDeployments(updatedWhere, options);

  //------------------------
  // User without credentials
  //------------------------
  } else {
    updatedWhere.public = true;
    response = await deploymentService.getDeployments(updatedWhere, options);
  }

  const deployments = response.deployments;
  const count = response.count;
  const total = response.total;
  const deploymentsWithContext = createDeploymentsResponse(deployments, {count, total});

  return deploymentsWithContext;

}


export async function getDeployment(deploymentid: string, user: ApiUser): Promise<any> {

  const deployment = await deploymentService.getDeployment(deploymentid);

  // This will throw an error if the user doesn't have any level of access to a private deployment.
  deploymentLevelCheck(deployment, user);

  const deploymentWithContext = createDeploymentResponse(deployment);
  return deploymentWithContext;

}


export async function createDeployment(deployment, user?: ApiUser): Promise<any> {

  permissionsCheck(user, 'create:deployment');

  const deploymentToCreate = cloneDeep(deployment);
  if (user.id) {
    deploymentToCreate.createdBy = user.id;
  }

  const createdDeployment = await deploymentService.createDeployment(deploymentToCreate);
  const deploymentWithContext = createDeploymentResponse(createdDeployment);
  return deploymentWithContext;

}


export async function updateDeployment(deploymentId: string, updates: any, user: ApiUser): Promise<any> {

  const deployment = await deploymentService.getDeployment(deploymentId);
  deploymentLevelCheck(deployment, user, ['admin']);

  const updatedDeployment = await deploymentService.updateDeployment(deploymentId, updates);
  const deploymentWithContext = createDeploymentResponse(updatedDeployment);
  return deploymentWithContext;

}


export async function deleteDeployment(deploymentId: string, user: ApiUser): Promise<void> {

  const deployment = deploymentService.getDeployment(deploymentId);
  deploymentLevelCheck(deployment, user, ['admin']);

  await deploymentService.deleteDeployment(deploymentId);
  return;

}