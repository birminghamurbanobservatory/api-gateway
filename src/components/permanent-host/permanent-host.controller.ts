import * as event from 'event-stream';
import {ApiUser} from '../common/api-user.class';
import {permissionsCheck} from '../common/permissions-check';
import * as permanentHostService from './permanent-host.service';
import {PaginationOptions} from '../common/pagination-options.class';
import {createPermanentHostResponse, createPermanentHostsResponse} from './permanent-host.formatter';


export async function createPermanentHost(permanentHost: any, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'create:permanent-host');
  
  const createdPermanentHost = await permanentHostService.createPermanentHost(permanentHost);
  const permanentHostWithContext = createPermanentHostResponse(createdPermanentHost);
  return permanentHostWithContext;

}

export async function getPermanentHosts(where = {}, options: PaginationOptions, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'get:permanent-host');

  const {permanentHosts, count, total} = await permanentHostService.getPermanentHosts(where, options);
  const permanentHostsWithContext = createPermanentHostsResponse(permanentHosts, {count, total});
  return permanentHostsWithContext;

}


export async function getPermanentHost(permanentHostId: string, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'get:permanent-host');

  const permanentHost = await permanentHostService.getPermanentHost(permanentHostId);
  const permanentHostWithContext = createPermanentHostResponse(permanentHost);
  return permanentHostWithContext;

}


export async function updatePermanentHost(permanentHostId: string, updates: any, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'update:permanent-host');

  const updatedPermanentHost = await permanentHostService.updatePermanentHost(permanentHostId, updates);
  const permanentHostWithContext = createPermanentHostResponse(updatedPermanentHost);
  return permanentHostWithContext;

}


export async function deletePermanentHost(permanentHostId: string, user: ApiUser): Promise<void> {

  permissionsCheck(user, 'delete:permanent-host');

  await permanentHostService.deletePermanentHost(permanentHostId);
  return;

}


