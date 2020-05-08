import {CollectionOptions} from '../common/collection-options.class';
import * as event from 'event-stream';


export async function createUsedProcedure(usedProcedure): Promise<any> {
  const created = await event.publishExpectingResponse('used-procedure.create.request',  {
    new: usedProcedure
  });
  return created;
}


export async function getUsedProcedure(id: string, options: {includeDeleted?: boolean} = {}): Promise<any> {
  const usedProcedure = await event.publishExpectingResponse('used-procedure.get.request', {
    where: {
      id
    },
    options
  });
  return usedProcedure;
}


export async function getUsedProcedures(where = {}, options: CollectionOptions = {}): Promise<any> {

  const response = await event.publishExpectingResponse('used-procedures.get.request', {
    where,
    options
  });

  return {
    usedProcedures: response.data,
    count: response.meta.count,
    total: response.meta.total
  };

}


export async function updateUsedProcedure(id: string, updates: any): Promise<any> {
  const updated = await event.publishExpectingResponse('used-procedure.update.request', {
    where: {
      id
    },
    updates
  });
  return updated;
}


export async function deleteUsedProcedure(id: string): Promise<void> {
  await event.publishExpectingResponse('used-procedure.delete.request', {
    where: {
      id
    }
  });
  return;
}

