import * as event from 'event-stream';


export async function createPlatform(platform): Promise<any> {
  const createdPlatform = await event.publishExpectingResponse('platform.create.request',  {
    new: platform
  });
  return createdPlatform;
}


export async function getPlatform(id: string, options: {nest?: boolean} = {}): Promise<any> {
  const platforms = await event.publishExpectingResponse('platform.get.request', {
    where: {
      id
    },
    options
  });
  return platforms;
}


export async function getPlatforms(where: {inDeployment?: string; isHostedBy?: any; hostedByPath?: any}): Promise<any> {
  const platforms = await event.publishExpectingResponse('platforms.get.request', {
    where
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


export async function unhostPlatform(id: string): Promise<any> {
  const updatedPlatform = await event.publishExpectingResponse('platform.unhost.request', {
    where: {
      id
    }
  });
  return updatedPlatform;
}


export async function deletePlatform(id: string): Promise<void> {
  await event.publishExpectingResponse('platform.delete.request', {
    where: {
      id
    }
  });
  return;
}



export async function releasePlatformSensors(platformId: string): Promise<void> {
  await event.publishExpectingResponse('platform.release-sensors.request', {
    where: {
      platformId
    }
  });
  return;
}




