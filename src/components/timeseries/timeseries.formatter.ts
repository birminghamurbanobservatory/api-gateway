import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';

const keyOrder = ['@context', '@id', '@type', 'startDate', 'endDate'];


export function formatIndividualTimeseries(timeseries): any {
  const timeseriesLinked = cloneDeep(timeseries);
  timeseriesLinked['@id'] = timeseriesLinked.id;
  delete timeseriesLinked.id;
  timeseriesLinked['@type'] = 'Timeseries';
  timeseriesLinked.startDate = timeseriesLinked.firstObs;
  timeseriesLinked.endDate = timeseriesLinked.lastObs;
  delete timeseriesLinked.firstObs;
  delete timeseriesLinked.lastObs;
  const ordered = orderObjectKeys(timeseriesLinked, keyOrder);
  return ordered;
}


export function createSingleTimeseriesResponse(timeseries: any): object {

  const timeseriesWithContext = formatIndividualTimeseries(timeseries);
  
  timeseriesWithContext['@context'] = [
    contextLinks.timeseries
  ];

  const ordered = orderObjectKeys(timeseriesWithContext, keyOrder);
  return ordered;

}


export function createMultipleTimeseriesResponse(timeseries: any[], extraInfo: {count: number; total: number}): object {

  const timeseriesLd = timeseries.map(formatIndividualTimeseries);

  const timeseriesWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.timeseries
    ],
    '@id': `${config.api.base}/timeseries`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: timeseriesLd,
    meta: extraInfo
  };

  return timeseriesWithContext;

}