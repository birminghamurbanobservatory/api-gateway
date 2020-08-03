import * as event from 'event-stream';


export async function getObservations(where: object, options: object): Promise<any> {

  const response = await event.publishExpectingResponse('observations.get.request', {
    where,
    options
  }, {
    timeout: 15000 // sometimes this request can take a while so let's set the timeout longer.
  });

  return {
    observations: response.data,
    meta: response.meta
  };

}


export async function getObservation(observationId: string): Promise<any> {

  const observation = await event.publishExpectingResponse('observation.get.request', {
    where: {
      id: observationId
    }
  });
  return observation;

}



export async function createObservation(observation: any): Promise<any> {
  // Because the incoming-observation-manager is setup to to handle observations with a series of queues, it cannot give us a direct response. So we'll need to replicate what it does here, but using RPC approach to get the response back each time.
  const observationWithContext = await giveObservationContext(observation);
  const savedObservation = await saveObservation(observationWithContext);
  return savedObservation;

}


export async function giveObservationContext(observation: any): Promise<any> {
  const updatedObservation = await event.publishExpectingResponse('observation.add-context', {
    observation
  });
  return updatedObservation;
}


export async function saveObservation(observation: any): Promise<any> {
  const updatedObservation = await event.publishExpectingResponse('observation.create', {
    new: observation
  });
  return updatedObservation;
}


export async function updateObservation(observationId: string, updates: any): Promise<any> {
  const updated = await event.publishExpectingResponse('observation.update.request', {
    where: {
      id: observationId
    },
    updates
  });
  return updated;
}


export async function deleteObservation(observationId: string): Promise<void> {
  // TODO
  return;
}



