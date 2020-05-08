import {CollectionOptions} from '../common/collection-options.class';
import * as event from 'event-stream';


export async function createDiscipline(discipline): Promise<any> {
  const created = await event.publishExpectingResponse('discipline.create.request',  {
    new: discipline
  });
  return created;
}


export async function getDiscipline(id: string, options: {includeDeleted?: boolean} = {}): Promise<any> {
  const discipline = await event.publishExpectingResponse('discipline.get.request', {
    where: {
      id
    },
    options
  });
  return discipline;
}


export async function getDisciplines(where = {}, options: CollectionOptions = {}): Promise<any> {

  const response = await event.publishExpectingResponse('disciplines.get.request', {
    where,
    options
  });

  return {
    disciplines: response.data,
    count: response.meta.count,
    total: response.meta.total
  };

}


export async function updateDiscipline(id: string, updates: any): Promise<any> {
  const updated = await event.publishExpectingResponse('discipline.update.request', {
    where: {
      id
    },
    updates
  });
  return updated;
}


export async function deleteDiscipline(id: string): Promise<void> {
  await event.publishExpectingResponse('discipline.delete.request', {
    where: {
      id
    }
  });
  return;
}

