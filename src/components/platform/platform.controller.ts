import * as event from 'event-stream';
import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';


export async function createPlatform(platform): Promise<any> {
  const createdPlatform = await event.publishExpectingResponse('platform.create.request',  {
    new: platform
  });
  return createdPlatform;
}


export async function getPlatform(id: string): Promise<any> {
  const platforms = await event.publishExpectingResponse('platform.get.request', {
    where: {
      id
    }
  });
  return platforms;
}


export async function getPlatforms(where: {inDeployment?: string}): Promise<any> {
  const platforms = await event.publishExpectingResponse('platforms.get.request', {
    where: {
      inDeployment: where.inDeployment
    }
  });
  return platforms;
}


export async function updatePlatform(id: string, updates: any): Promise<any> {

  const updatedPlatform = await event.publishExpectingResponse('platform.update.request', {
    where: {
      id
    },
    updates
  });

  return updatedPlatform;
}


export async function rehostPlatform(id: string, hostId: string): Promise<any> {
  const updatedPlatform = await event.publishExpectingResponse('platform.rehost.request', {
    where: {
      id,
      hostId
    }
  });
  return updatedPlatform;
}




export function formatPlatformForClient(platform: object): object {
  const forClient = cloneDeep(platform);
  delete forClient.users;
  delete forClient.createdBy;
  const ordered = orderObjectKeys(forClient, ['id', 'name', 'description', 'static', 'ownerDeployment', 'inDeployments', 'location']);
  return ordered;
}