import * as deploymentService from './deployment.service';
import {ApiUser} from '../common/api-user.class';
import {WhereItem} from '../common/where-item.class';
import {concat, uniqBy, cloneDeep} from 'lodash';
import {permissionsCheck} from '../common/permissions-check';
import {deploymentLevelCheck} from './deployment-level-check';
import {createDeploymentsResponse, createDeploymentResponse} from './deployment.formatter';
import * as check from 'check-types';


export async function getDeployments(where: {public?: boolean; id?: WhereItem; search?: string}, options: any, user: ApiUser): Promise<any> {

  const canGetAllDeployments = user.permissions.includes('get:deployments');
  const hasAdminRightsToAllDeployments = user.permissions.includes('admin-all:deployments');

  let response;
  const updatedWhere: any = cloneDeep(where);

  //------------------------
  // Superuser
  //------------------------
  if (canGetAllDeployments) {
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

  // Add the user's access level to each of these deployments
  const deploymentsWithAccessLevel = deployments.map((deployment): any => {
    let accessLevel;
    if (hasAdminRightsToAllDeployments) {
      accessLevel = 'admin';
    } else {
      try {
        accessLevel = deploymentLevelCheck(deployment, user);
      } catch (err) {
        // We might get an error if the user has the special 'get:deployments' permission, but not specific rights to a private deployment, in this case we'll default to basic rights.
        if (canGetAllDeployments) {
          accessLevel = 'basic';
        } else {
          throw err; // Technically we shouldn't ever make it to this point.
        }
      }
    }
    deployment.yourAccessLevel = accessLevel;
    return deployment;
  });

  const deploymentsWithContext = createDeploymentsResponse(deploymentsWithAccessLevel, {count, total});

  return deploymentsWithContext;

}


export async function getDeployment(deploymentid: string, user: ApiUser): Promise<any> {

  const deployment = await deploymentService.getDeployment(deploymentid);

  // This will throw an error if the user doesn't have any level of access to a private deployment.
  const accessLevel = deploymentLevelCheck(deployment, user);
  deployment.yourAccessLevel = accessLevel;
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
  createdDeployment.yourAccessLevel = 'admin';
  const deploymentWithContext = createDeploymentResponse(createdDeployment);
  return deploymentWithContext;

}


export async function updateDeployment(deploymentId: string, updates: any, user: ApiUser): Promise<any> {

  const deployment = await deploymentService.getDeployment(deploymentId);
  const accessLevel = deploymentLevelCheck(deployment, user, ['admin']);

  const updatedDeployment = await deploymentService.updateDeployment(deploymentId, updates);
  updatedDeployment.yourAccessLevel = accessLevel;
  const deploymentWithContext = createDeploymentResponse(updatedDeployment);
  return deploymentWithContext;

}


export async function deleteDeployment(deploymentId: string, user: ApiUser): Promise<void> {

  const deployment = deploymentService.getDeployment(deploymentId);
  deploymentLevelCheck(deployment, user, ['admin']);

  await deploymentService.deleteDeployment(deploymentId);
  return;

}
