import {CollectionOptions} from '../common/collection-options.class';
import * as event from 'event-stream';


export async function createUnit(unit): Promise<any> {
  const created = await event.publishExpectingResponse('unit.create.request',  {
    new: unit
  });
  return created;
}


export async function getUnit(id: string, options: {includeDeleted?: boolean} = {}): Promise<any> {
  const unit = await event.publishExpectingResponse('unit.get.request', {
    where: {
      id
    },
    options
  });
  return unit;
}


export async function getUnits(where = {}, options: CollectionOptions = {}): Promise<any> {

  const response = await event.publishExpectingResponse('units.get.request', {
    where,
    options
  });

  return {
    units: response.data,
    count: response.meta.count,
    total: response.meta.total
  };

}


export async function updateUnit(id: string, updates: any): Promise<any> {
  const updated = await event.publishExpectingResponse('unit.update.request', {
    where: {
      id
    },
    updates
  });
  return updated;
}


export async function deleteUnit(id: string): Promise<void> {
  await event.publishExpectingResponse('unit.delete.request', {
    where: {
      id
    }
  });
  return;
}

