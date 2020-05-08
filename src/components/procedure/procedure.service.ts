import {CollectionOptions} from '../common/collection-options.class';
import * as event from 'event-stream';


export async function createProcedure(procedure): Promise<any> {
  const created = await event.publishExpectingResponse('procedure.create.request',  {
    new: procedure
  });
  return created;
}


export async function getProcedure(id: string, options: {includeDeleted?: boolean} = {}): Promise<any> {
  const procedure = await event.publishExpectingResponse('procedure.get.request', {
    where: {
      id
    },
    options
  });
  return procedure;
}


export async function getProcedures(where = {}, options: CollectionOptions = {}): Promise<any> {

  const response = await event.publishExpectingResponse('procedures.get.request', {
    where,
    options
  });

  return {
    procedures: response.data,
    count: response.meta.count,
    total: response.meta.total
  };

}


export async function updateProcedure(id: string, updates: any): Promise<any> {
  const updated = await event.publishExpectingResponse('procedure.update.request', {
    where: {
      id
    },
    updates
  });
  return updated;
}


export async function deleteProcedure(id: string): Promise<void> {
  await event.publishExpectingResponse('procedure.delete.request', {
    where: {
      id
    }
  });
  return;
}

