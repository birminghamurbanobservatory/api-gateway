import * as event from 'event-stream';
import {PaginationOptions} from '../common/pagination-options.class';


export async function getUnknownSensors(options: PaginationOptions): Promise<{unknownSensors: any[]; totalCount: number}> {
  const response = await event.publishExpectingResponse('unknown-sensors.get.request', {
    options
  });
  return {
    unknownSensors: response.data,
    totalCount: response.meta.totalCount
  };
}



