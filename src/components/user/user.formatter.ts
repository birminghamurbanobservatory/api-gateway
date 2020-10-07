import {cloneDeep, omit, pick} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {renameProperties} from '../../utils/rename';

const keyOrder = ['@context', '@id', '@type', 'name', 'accessLevel'];


export function formatIndividualUser(user: any): any {
  const userCloned = cloneDeep(user);
  // There's plenty more properties from Auth0 that I could include here, e.g. nickname, email, last_login, logins_count, but decided best not to in the interest of not sharing too much info between users.
  const userLinked = pick(userCloned, ['id', 'level', 'name']); 
  userLinked['@type'] = 'User';
  const renamed = renameProperties(userLinked, {
    id: '@id',
    level: 'accessLevel'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
  return ordered;
}


export function createUserResponse(user: any): object {

  const userWithContext = formatIndividualUser(user);

  userWithContext['@context'] = [
    contextLinks.user
  ];

  const ordered = orderObjectKeys(userWithContext, keyOrder);
  return ordered;

}


export function createUsersResponse(users: any[], extraInfo: {count: number; total: number}): object {

  const usersLd = users.map(formatIndividualUser);

  const usersWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.user
    ],
    // TODO: should really have an @id here, but the id would need to include the deploymentId, so need to handle this elsewhere.
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: usersLd,
    meta: extraInfo
  };

  return usersWithContext;

}