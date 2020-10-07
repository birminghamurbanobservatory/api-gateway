import {ManagementClient} from 'auth0';
import {config} from '../../config/index';
import * as logger from 'node-logger';

// Info
// In order to get extra details about users we need to call the Auth0 Management API (https://auth0.com/docs/api/management/v2). In order to do this you need to create a "Machine to Machine" "Application" on Auth0. You will need to configure it so that it is allowed access to the "Auth0 Managment API". Also in order to get details about users it will need to have the scopes "read:users" and "read:user_idp_tokens".
// We're using auth0's Node.js package to make things simplier. 


const auth0 = new ManagementClient({
  domain: config.auth0Management.domain,
  clientId: config.auth0Management.clientId,
  clientSecret: config.auth0Management.clientSecret,
  scope: 'read:users read:user_idp_tokens'
});





export async function getAuth0Users(userIds: string[]): Promise<any[]> {

  if (userIds.length === 0) {
    return [];
  }

  const bitsForQ = userIds.map((userId): string => {
    return `user_id:"${userId}"`;
  }) ;

  const q = bitsForQ.join(' OR ');

  const users = await auth0.getUsers({q});
  return users;

}