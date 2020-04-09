import * as deploymentService from './deployment.service';
import {ApiUser} from '../common/api-user.class';
import {WhereItem} from '../common/where-item.class';
import {concat, uniqBy, cloneDeep} from 'lodash';
import {permissionsCheck} from '../common/permissions-check';
import {deploymentLevelCheck} from './deployment-level-check';
import {createDeploymentsResponse, createDeploymentResponse} from './deployment.formatter';
import {PaginationOptions} from '../common/pagination-options.class';


export async function getDeployments(where: {public?: boolean; id?: WhereItem}, user: ApiUser, options: any): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('get:deployments');

  let response;

  //------------------------
  // Superuser
  //------------------------
  if (hasSuperUserPermission) {
    response = await deploymentService.getDeployments(where, options);
  }

  //------------------------
  // User with credentials
  //------------------------
  if (user.id) {
    const usersWhere = Object.assign({}, where, {user: user.id});
    response = await deploymentService.getDeployments(usersWhere, options);
  }

  //------------------------
  // User without credentials
  //------------------------
  if (!user.id) {
    const noCredentialsWhere = Object.assign({}, where, {public: true});
    response = await deploymentService.getDeployments(noCredentialsWhere, options);
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