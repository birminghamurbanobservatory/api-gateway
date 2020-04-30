import * as event from 'event-stream';
import {CollectionOptions} from '../common/collection-options.class';


export async function getUnknownSensors(where, options: CollectionOptions): Promise<{unknownSensors: any[]; count: number; total: number}> {
  const response = await event.publishExpectingResponse('unknown-sensors.get.request', {
    where,
    options
  });
  return {
    unknownSensors: response.data,
    count: response.meta.count,
    total: response.meta.total
  };
}



