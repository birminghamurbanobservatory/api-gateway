
import * as event from 'event-stream';

export async function createObservableProperty(observableProperty): Promise<any> {

  const createdObservableProperty = await event.publishExpectingResponse('observable-property.create.request',  {
    new: observableProperty
  });
  return createdObservableProperty;

}


export async function getObservableProperty(observablePropertyId): Promise<any> {
  const observableProperty = await event.publishExpectingResponse('observable-property.get.request', {
    where: {
      id: observablePropertyId
    }
  }); 
  return observableProperty;
}


export async function getObservableProperties(): Promise<any> {
  const observableProperties = await event.publishExpectingResponse('observable-properties.get.request'); 
  return observableProperties;
}