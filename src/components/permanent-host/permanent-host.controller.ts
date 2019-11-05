import * as event from 'event-stream';
import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';


export async function createPermanentHost(permanentHost): Promise<any> {
  const createdPermanentHost = await event.publishExpectingResponse('permanent-host.create.request',  {
    new: permanentHost
  });
  return createdPermanentHost;
}



export function formatPermanentHostForClient(permanentHost: object): object {
  const forClient = cloneDeep(permanentHost);
  const ordered = orderObjectKeys(forClient, ['id', 'name', 'description', 'registrationKey']);
  return ordered;
}