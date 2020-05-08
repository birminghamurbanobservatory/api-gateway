import {CollectionOptions} from '../common/collection-options.class';
import * as event from 'event-stream';


export async function createFeatureOfInterest(featureOfInterest): Promise<any> {
  const created = await event.publishExpectingResponse('feature-of-interest.create.request',  {
    new: featureOfInterest
  });
  return created;
}


export async function getFeatureOfInterest(id: string, options: {includeDeleted?: boolean} = {}): Promise<any> {
  const featureOfInterest = await event.publishExpectingResponse('feature-of-interest.get.request', {
    where: {
      id
    },
    options
  });
  return featureOfInterest;
}


export async function getFeaturesOfInterest(where = {}, options: CollectionOptions = {}): Promise<any> {

  const response = await event.publishExpectingResponse('features-of-interest.get.request', {
    where,
    options
  });

  return {
    featuresOfInterest: response.data,
    count: response.meta.count,
    total: response.meta.total
  };

}


export async function updateFeatureOfInterest(id: string, updates: any): Promise<any> {
  const updated = await event.publishExpectingResponse('feature-of-interest.update.request', {
    where: {
      id
    },
    updates
  });
  return updated;
}


export async function deleteFeatureOfInterest(id: string): Promise<void> {
  await event.publishExpectingResponse('feature-of-interest.delete.request', {
    where: {
      id
    }
  });
  return;
}

