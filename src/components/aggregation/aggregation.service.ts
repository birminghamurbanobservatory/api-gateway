import {CollectionOptions} from '../common/collection-options.class';
import * as event from 'event-stream';


export async function createAggregation(aggregation): Promise<any> {
  const created = await event.publishExpectingResponse('aggregation.create.request',  {
    new: aggregation
  });
  return created;
}


export async function getAggregation(id: string, options: {includeDeleted?: boolean} = {}): Promise<any> {
  const aggregation = await event.publishExpectingResponse('aggregation.get.request', {
    where: {
      id
    },
    options
  });
  return aggregation;
}


export async function getAggregations(where = {}, options: CollectionOptions = {}): Promise<any> {

  const response = await event.publishExpectingResponse('aggregations.get.request', {
    where,
    options
  });

  return {
    aggregations: response.data,
    count: response.meta.count,
    total: response.meta.total
  };

}


export async function updateAggregation(id: string, updates: any): Promise<any> {
  const updated = await event.publishExpectingResponse('aggregation.update.request', {
    where: {
      id
    },
    updates
  });
  return updated;
}


export async function deleteAggregation(id: string): Promise<void> {
  await event.publishExpectingResponse('aggregation.delete.request', {
    where: {
      id
    }
  });
  return;
}

