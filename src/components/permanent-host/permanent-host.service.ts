import * as event from 'event-stream';



export async function createPermanentHost(permanentHost): Promise<any> {
  const createdPermanentHost = await event.publishExpectingResponse('permanent-host.create.request',  {
    new: permanentHost
  });
  return createdPermanentHost;
}

export async function getPermanentHosts(where = {}): Promise<any> {
  const permanentHost = await event.publishExpectingResponse('permanent-hosts.get.request', {
    where
  });
  return permanentHost;
}

export async function getPermanentHost(permanentHostId: string): Promise<any> {
  const permanentHost = await event.publishExpectingResponse('permanent-host.get.request', {
    where: {
      id: permanentHostId
    }
  });
  return permanentHost;
}


export async function updatePermanentHost(id: string, updates: any): Promise<any> {
  const updatedSensor = await event.publishExpectingResponse('permament-host.update.request',  {
    where: {
      id
    },
    updates
  });
  return updatedSensor;
}


export async function deletePermanentHost(id: string): Promise<void> {
  await event.publishExpectingResponse('permanent-host.delete.request', {
    where: {
      id
    }
  });
  return;
}

