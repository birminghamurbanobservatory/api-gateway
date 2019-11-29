import {Unauthorized} from '../../errors/Unauthorized';
import {InsufficientDeploymentRights} from '../../errors/InsufficientDeploymentRights';

export function deploymentLevelCheck(sufficientLevels: string[]): any {

  return function(req, res, next): any {

    if (!req.user.id) {
      return next(new Unauthorized('Authentication is required to make this request.'));
    }

    if (!sufficientLevels.includes(req.user.deploymentLevel)) {
      return next(new InsufficientDeploymentRights(`Your access level to this deployment is insufficient. Your level: ${req.user.deploymentLevel}. Acceptable levels: ${sufficientLevels.join(', ')}.`));
    } 

    // continue
    return next();
  
  };

}