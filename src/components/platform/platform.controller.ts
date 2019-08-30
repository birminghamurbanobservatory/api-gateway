import * as event from 'event-stream';


export async function createPlatform(platform): Promise<any> {
  const createdPlatform = await event.publishExpectingResponse('platform.create.request',  {
    new: platform
  });
  return createdPlatform;
}


export async function getPlatform(id: string, inDeployment: string): Promise<any> {
  const platforms = await event.publishExpectingResponse('platform.get.request', {
    where: {
      id,
      inDeployment
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