import * as event from 'event-stream';
import {CollectionOptions} from '../common/collection-options.class';



export async function getSingleTimeseries(timeseriesId): Promise<any> {
  const timeseries = await event.publishExpectingResponse('single-timeseries.get.request', {
    where: {
      id: timeseriesId
    }
  }); 
  return timeseries;
}


export async function getMultipleTimeseries(where, options: CollectionOptions): Promise<any> {
  const response = await event.publishExpectingResponse('multiple-timeseries.get.request', {
    where,
    options
  }); 
  return {
    timeseries: response.data,
    count: response.meta.count,
    total: response.meta.total
  };
}