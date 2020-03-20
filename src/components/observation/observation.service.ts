import * as event from 'event-stream';


export async function getObservations(where: object, options: object): Promise<any> {

  const response = await event.publishExpectingResponse('observations.get.request', {
    where,
    options
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

  const createdObservation = await event.publishExpectingResponse('observation.incoming', observation);
  return createdObservation;

}



export async function deleteObservation(observationId: string): Promise<void> {
  // TODO
  return;
}



