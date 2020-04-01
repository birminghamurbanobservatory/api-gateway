import * as deploymentService from './deployment.service';
import {ApiUser} from '../common/api-user.class';
import {WhereItem} from '../common/where-item.class';
import {concat, uniqBy, cloneDeep} from 'lodash';
import {formatDeploymentForClient, addContextToDeployments, addContextToDeployment} from './deployment.formatter';
import {permissionsCheck} from '../common/permissions-check';
import {deploymentLevelCheck} from './deployment-level-check';


export async function getDeployments(where: {public?: boolean; id?: WhereItem}, user: ApiUser, options: {includeAllPublic: boolean}): Promise<any> {

  const hasSuperUserPermission = user.permissions.includes('get:deployments');

  let deployments;

  //------------------------
  // Superuser
  //------------------------
  if (hasSuperUserPermission) {
    deployments = await deploymentService.getDeployments(where);
  }

  //------------------------
  // User with credentials
  //------------------------
  if (user.id) {

    const usersWhere = Object.assign({}, where, {user: user.id});
    const usersDeployments = await deploymentService.getDeployments(usersWhere);

    let allPublicDeployments = [];
    if (options.includeAllPublic === true) {
      allPublicDeployments = await deploymentService.getDeployments({public: true});
    }

    const combindedDeployments = concat(usersDeployments, allPublicDeployments);
    const uniqueDeployments = uniqBy(combindedDeployments, 'id');

    deployments = uniqueDeployments;

  }

  //------------------------
  // User without credentials
  //------------------------
  if (!user.id) {
    const noCredentialsWhere = Object.assign({}, where, {public: true});
    deployments = await deploymentService.getDeployments(noCredentialsWhere);
  }

  const deploymentsForClient = deployments.map(formatDeploymentForClient);
  const deploymentsWithContext = addContextToDeployments(deploymentsForClient);

  return deploymentsWithContext;

}



export async function getDeployment(deploymentid: string, user: ApiUser): Promise<any> {

  const deployment = await deploymentService.getDeployment(deploymentid);

  // This will throw an error if the user doesn't have any level of access to a private deployment.
  deploymentLevelCheck(deployment, user);

  const deploymentForClient = formatDeploymentForClient(deployment);
  const deploymentWithContext = addContextToDeployment(deploymentForClient);
  return deploymentWithContext;

}


export async function createDeployment(deployment, user?: ApiUser): Promise<any> {

  permissionsCheck(user, 'create:deployment');

  const deploymentToCreate = cloneDeep(deployment);
  if (user.id) {
    deploymentToCreate.createdBy = user.id;
  }

  const createdDeployment = await deploymentService.createDeployment(deploymentToCreate);
  const deploymentForClient = formatDeploymentForClient(createdDeployment);
  const deploymentWithContext = addContextToDeployment(deploymentForClient);
  return deploymentWithContext;

}


export async function updateDeployment(deploymentId: string, updates: any, user: ApiUser): Promise<any> {

  const deployment = await deploymentService.getDeployment(deploymentId);
  deploymentLevelCheck(deployment, user, ['admin']);

  const updatedDeployment = await deploymentService.updateDeployment(deploymentId, updates);
  const deploymentForClient = formatDeploymentForClient(updatedDeployment);
  const deploymentWithContext = addContextToDeployment(deploymentForClient);
  return deploymentWithContext;

}


export async function deleteDeployment(deploymentId: string, user: ApiUser): Promise<void> {

  const deployment = deploymentService.getDeployment(deploymentId);
  deploymentLevelCheck(deployment, user, ['admin']);

  await deploymentService.deleteDeployment(deploymentId);
  return;

}