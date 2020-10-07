import {ApiUser} from '../common/api-user.class';
import {deploymentLevelCheck} from '../deployment/deployment-level-check';
import {getDeployment} from '../deployment/deployment.service';
import {createUsersResponse} from './user.formatter';
import {getAuth0Users} from './auth0-management.service';
import * as logger from 'node-logger';
import {cloneDeep} from 'lodash';
import * as userService from './user.service';
import {Forbidden} from '../../errors/Forbidden';
import {Unauthorized} from '../../errors/Unauthorized';


export async function getDeploymentUsers(deploymentId: string, userMakingRequest: ApiUser): Promise<any> {

  const hasSuperUserPermission = userMakingRequest.permissions.includes('admin-all:deployments');

  const deployment = await getDeployment(deploymentId);

  if (!hasSuperUserPermission) {
    deploymentLevelCheck(deployment, userMakingRequest, ['admin', 'social']);
  }

  // Call Auth0 to get some more meaningful user data.
  logger.debug('Calling Auth0 for extra user info');
  const auth0Users = await getAuth0Users(deployment.users.map((user): string => user.id));
  logger.debug('Got extra user info from Auth0');

  const usersWithFullInfo = deployment.users.map((user): any => {
    let userWithFullInfo = cloneDeep(user);
    const matchingAuth0Record = auth0Users.find((auth0User): any => auth0User.user_id === user.id);
    userWithFullInfo = Object.assign({}, userWithFullInfo, matchingAuth0Record);
    return userWithFullInfo;
  });

  const nUsers = deployment.users.length;
  const deploymentsWithContext = createUsersResponse(usersWithFullInfo, {count: nUsers, total: nUsers});

  return deploymentsWithContext;

}


export async function deleteDeploymentUser(deploymentId: string, userIdToDelete: string, userMakingRequest: ApiUser): Promise<void> {

  const hasSuperUserPermission = userMakingRequest.permissions.includes('admin-all:deployments');

  const deployment = await getDeployment(deploymentId);

  if (!hasSuperUserPermission) {
    deploymentLevelCheck(deployment, userMakingRequest, ['admin']);
  }

  // Make sure they can't delete themselves (see leaveDeployment function below for this)
  if (userIdToDelete === userMakingRequest.id) {
    throw new Forbidden('You are not allowed to delete yourself from a deployment this way');
  }

  // Get the user to check if this user is allowed to delete them, i.e. admins can't delete other admins.
  const deploymentUser = await userService.getDeploymentUser(deploymentId, userIdToDelete);
  if (deploymentUser.level === 'admin') {
    throw new Forbidden('It is not possible to delete other admin users.');
  }

  await userService.deleteDeploymentUser(deploymentId, userIdToDelete);

  return;

}



export async function leaveDeployment(deploymentId: string, userMakingRequest: ApiUser): Promise<void> {

  if (!userMakingRequest || !userMakingRequest.id) {
    throw new Unauthorized('Please provide user authentication in order to leave a deployment.');
  }

  await userService.deleteDeploymentUser(deploymentId, userMakingRequest.id);

  return;

}