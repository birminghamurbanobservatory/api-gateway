import {PermissionRequired} from '../../errors/PermissionRequired';
import {Unauthorized} from '../../errors/Unauthorized';
import * as check from 'check-types';


// N.B. in the future you may wish to allow certain permissions to be granted to all users without having them explicted listed for the user. This would be straight forward to implement here, e.g. if permissionsGrantedToAllUsers.includes(requiredPermission) then next().
export function permissionsCheck(requiredPermission: string): any {
   
  return function(req, res, next): any {

    if (!req.user.id) {
      return next(new Unauthorized('Authentication is required to make this request.'));
    }

    if (!req.user.permissions || !req.user.permissions.includes(requiredPermission)) {

      let userPermissionsInfo;
      if (check.nonEmptyArray(req.user.permissions)) {
        const permissionsQuoted = req.user.permissions.map((permission): string => `'${permission}'`);
        userPermissionsInfo = `Your permissions: ${permissionsQuoted.join(', ')}.`;
      } else {
        userPermissionsInfo = 'You have no permissions.';
      }

      return next(new PermissionRequired(`Only users that have been assigned the special permission '${requiredPermission}' can make this request. ${userPermissionsInfo}`));

    } 

    // continue
    return next();
  
  };

}