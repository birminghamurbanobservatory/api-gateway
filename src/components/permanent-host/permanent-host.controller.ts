import * as event from 'event-stream';
import {ApiUser} from '../common/api-user.class';
import {permissionsCheck} from '../common/permissions-check';
import * as permanentHostService from './permanent-host.service';
import {formatPermanentHostForClient, addContextToPermanentHost, addContextToPermanentHosts} from './permanent-host.formatter';


export async function createPermanentHost(permanentHost: any, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'create:permanent-host');
  
  const createdPermanentHost = await permanentHostService.createPermanentHost(permanentHost);
  const permanentHostForClient = formatPermanentHostForClient(createdPermanentHost);
  const permanentHostWithContext = addContextToPermanentHost(permanentHostForClient);
  return permanentHostWithContext;

}

export async function getPermanentHosts(where = {}, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'get:permanent-host');

  const permanentHosts = await permanentHostService.getPermanentHosts(where);
  const permanentHostsForClient = permanentHosts.map(formatPermanentHostForClient);
  const permanentHostsWithContext = addContextToPermanentHosts(permanentHostsForClient);
  return permanentHostsWithContext;

}


export async function getPermanentHost(permanentHostId: string, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'get:permanent-host');

  const permanentHost = await permanentHostService.getPermanentHost(permanentHostId);
  const permanentHostForClient = formatPermanentHostForClient(permanentHost);
  const permanentHostWithContext = addContextToPermanentHost(permanentHostForClient);
  return permanentHostWithContext;

}


export async function updatePermanentHost(permanentHostId: string, updates: any, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'update:permanent-host');

  const updatedPermanentHost = await permanentHostService.updatePermanentHost(permanentHostId, updates);
  const permanentHostForClient = formatPermanentHostForClient(updatedPermanentHost);
  const permanentHostWithContext = addContextToPermanentHost(permanentHostForClient);
  return permanentHostWithContext;

}


export async function deletePermanentHost(permanentHostId: string, user: ApiUser): Promise<void> {

  permissionsCheck(user, 'delete:permanent-host');

  await permanentHostService.deletePermanentHost(permanentHostId);
  return;

}


