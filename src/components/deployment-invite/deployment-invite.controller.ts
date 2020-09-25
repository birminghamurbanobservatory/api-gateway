import {cloneDeep} from 'lodash';
import {Forbidden} from '../../errors/Forbidden';
import {Unauthorized} from '../../errors/Unauthorized';
import {renameProperty} from '../../utils/rename';
import {ApiUser} from '../common/api-user.class';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';
import {createDeploymentResponse} from '../deployment/deployment.formatter';
import {getDeployment} from '../deployment/deployment.service';
import {createDeploymentInviteResponse} from './deployment-invite.formatter';
import * as deploymentInviteService from './deployment-invite.service';


export async function createDeploymentInvite(deploymentId, inviteSettings, user?: ApiUser): Promise<any> {

  const deployment = await getDeployment(deploymentId);

  // Check user has sufficient rights to this deployment to create an invite
  const userLevel = deploymentLevelCheck(deployment, user, ['admin', 'social']);

  // Make sure a user can't invite other users to a higher access level than their own.
  if (userLevel === 'social' && !['social', 'basic'].includes(inviteSettings.accessLevel)) {
    throw new Forbidden(`As a 'social' user of this deployment you can not grant other users ${inviteSettings.accessLevel} level access.`);
  }

  let deploymentInviteToCreate = cloneDeep(inviteSettings);
  // Backend uses level rather than accessLevel as the key name
  deploymentInviteToCreate = renameProperty(deploymentInviteToCreate, 'accessLevel', 'level');
  deploymentInviteToCreate.deploymentId = deploymentId;
  deploymentInviteToCreate.deploymentLabel = deployment.label;

  const createdDeploymentInvite = await deploymentInviteService.createDeploymentInvite(deploymentInviteToCreate);

  const deploymentInviteWithContext = createDeploymentInviteResponse(createdDeploymentInvite);
  return deploymentInviteWithContext;

}



export async function getDeploymentInvite(id: string): Promise<any> {

  // No special authentication or authorisation are required to get an invite, the user simply needs to know the invite id.

  const deploymentInvite = await deploymentInviteService.getDeploymentInvite(id);
  const deploymentInviteWithContext = createDeploymentInviteResponse(deploymentInvite);
  return deploymentInviteWithContext;

}



export async function acceptDeploymentInvite(id: string, user?: ApiUser): Promise<any> {

  // The request must have provided authentication because we need the user's id.
  if (!user.id) {
    throw new Unauthorized('Authentication is required in or to accept a deployment invite');
  }

  const updatedDeployment = await deploymentInviteService.acceptDeploymentInvite(id, user.id);
  // Use the deploymentLevelCheck function to extract the user's newly added access level
  const accessLevel = deploymentLevelCheck(updatedDeployment, user);
  updatedDeployment.yourAccessLevel = accessLevel;
  // N.B. we're returning the deployment the user now has access too.
  const deploymentWithContext = createDeploymentResponse(updatedDeployment);
  return deploymentWithContext;

}