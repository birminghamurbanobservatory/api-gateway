import {CollectionOptions} from '../common/collection-options.class';
import * as event from 'event-stream';


export async function createCheck(check): Promise<any> {
  const created = await event.publishExpectingResponse('check.create.request',  {
    new: check
  });
  return created;
}


export async function getCheck(id: string): Promise<any> {
  const check = await event.publishExpectingResponse('check.get.request', {
    where: {
      id
    }
  });
  return check;
}


export async function getChecks(where = {}, options: CollectionOptions = {}): Promise<any> {

  const response = await event.publishExpectingResponse('checks.get.request', {
    where,
    options
  });

  return {
    checks: response.data,
    count: response.meta.count,
    total: response.meta.total
  };

}


export async function deleteCheck(id: string): Promise<void> {
  await event.publishExpectingResponse('check.delete.request', {
    where: {
      id
    }
  });
  return;
}
