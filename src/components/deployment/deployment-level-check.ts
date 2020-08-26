import {ApiUser} from '../common/api-user.class';
import {Forbidden} from '../../errors/Forbidden';
import {InsufficientDeploymentAccessLevel} from '../../errors/InsufficientDeploymentAccessLevel';
import * as logger from 'node-logger';


// Finds out what level of access a user has to deployment, and will throw an error if it is not sufficient enough. It also prevents unauthenticated users from accessing private deployments.
export function deploymentLevelCheck(deployment: any, user: ApiUser, sufficientLevels?: string[]): string {

  const allPossibleRights = ['admin', 'engineer', 'social', 'basic'];

  // Check the sufficientLevels provided are actually valid
  if (sufficientLevels) {
    sufficientLevels.forEach((sufficientLevel): void => {
      if (!allPossibleRights.includes(sufficientLevel)) {
        throw new Error(`${sufficientLevels} is not a valid user deployment level`);
      }
    });
  }

  const adminToAll = user.permissions.includes('admin-all:deployments');
  // TODO: you may eventually wish to create basic-all:deployments, or engineer-all:deployments permissions, however you'd need to make sure that if the user already has specific rights to this deployment and they are higher than the generic permission, that it uses the more specific one.

  let userLevel;
  
  if (adminToAll) {
    userLevel = 'admin';

  } else {
    let userHasSpecificRights;
    const deploymentIsPublic = deployment.public;

    if (user.id) {
      const matchingUser = deployment.users.find((user): any => user.id === user.id);
      if (matchingUser) {
        userHasSpecificRights = true;
        userLevel = matchingUser.level;
      } 
    }

    if (!userHasSpecificRights) {
      if (deploymentIsPublic) {
        userLevel = 'basic';
      } else {
        throw new Forbidden('You are not a user of this private deployment');
      }
    }

  }

  if (sufficientLevels) {
    if (!sufficientLevels.includes(userLevel)) {
      throw new InsufficientDeploymentAccessLevel(`Your access level to the deployment ${deployment.id} is insufficient. Your level: ${userLevel}. Acceptable levels for this request: ${sufficientLevels.join(', ')}.`);
    } 
  }

  logger.debug(`User ${user.id ? `'${user.id}'` : '(unauthenticated)'} has '${userLevel}' rights to deployment '${deployment.id}'`);

  return userLevel;

}