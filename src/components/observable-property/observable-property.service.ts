import {CollectionOptions} from '../common/collection-options.class';
import * as event from 'event-stream';


export async function createObservableProperty(observableProperty): Promise<any> {
  const created = await event.publishExpectingResponse('observable-property.create.request',  {
    new: observableProperty
  });
  return created;
}


export async function getObservableProperty(id: string, options: {includeDeleted?: boolean} = {}): Promise<any> {
  const observableProperty = await event.publishExpectingResponse('observable-property.get.request', {
    where: {
      id
    },
    options
  });
  return observableProperty;
}


export async function getObservableProperties(where = {}, options: CollectionOptions = {}): Promise<any> {

  const response = await event.publishExpectingResponse('observable-properties.get.request', {
    where,
    options
  });

  return {
    observableProperties: response.data,
    count: response.meta.count,
    total: response.meta.total
  };

}


export async function updateObservableProperty(id: string, updates: any): Promise<any> {
  const updated = await event.publishExpectingResponse('observable-property.update.request', {
    where: {
      id
    },
    updates
  });
  return updated;
}


export async function deleteObservableProperty(id: string): Promise<void> {
  await event.publishExpectingResponse('observable-property.delete.request', {
    where: {
      id
    }
  });
  return;
}

