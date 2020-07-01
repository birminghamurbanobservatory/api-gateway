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


export async function mergeTimeseries(goodIdToKeep, idsToMerge): Promise<{nObservationsMerged: number}> {
  const result = await event.publishExpectingResponse('timeseries.merge.request', {
    goodIdToKeep,
    idsToMerge
  }, {
    timeout: 15000 // sometimes this request can take a while so let's set the timeout longer.
  }); 
  return result;
}


export async function deleteSingleTimeseries(timeseriesId): Promise<void> {
  await event.publishExpectingResponse('single-timeseries.delete.request', {
    where: {
      id: timeseriesId
    }
  }, {
    timeout: 10000 // might take a while to delete all the observations.
  }); 
  return;
}