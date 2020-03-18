import {ApiUser} from './api-user.class';
import {Unauthorized} from '../../errors/Unauthorized';
import * as check from 'check-types';
import {PermissionRequired} from '../../errors/PermissionRequired';

// N.B. in the future you may wish to allow certain permissions to be granted to all users without having them explicted listed for the user. The easiest way of doing this would probably be to have some middleware at the root of the api that adds selected permissions array to the req.user.permissions array.
export function permissionsCheck(user: ApiUser, requiredPermission: string): any {

  if (!user.id) {
    throw new Unauthorized('Authentication is required to make this request.');
  }

  if (!user.permissions || !user.permissions.includes(requiredPermission)) {

    let userPermissionsInfo;
    if (check.nonEmptyArray(user.permissions)) {
      const permissionsQuoted = user.permissions.map((permission): string => `'${permission}'`);
      userPermissionsInfo = `Your permissions: ${permissionsQuoted.join(', ')}.`;
    } else {
      userPermissionsInfo = 'You have no permissions.';
    }

    throw new PermissionRequired(`Only users that have been assigned the special permission '${requiredPermission}' can make this request. ${userPermissionsInfo}`);

  } 

  // continue
  return;
  
}