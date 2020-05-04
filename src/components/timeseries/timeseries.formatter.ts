import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {renameProperties} from '../../utils/rename';

const keyOrder = ['@context', '@id', '@type', 'startDate', 'endDate', 'hasObservations', 'observedProperty', 'unit', 'madeBySensor', 'hasDeployment', 'ancestorPlatforms', 'hasFeatureOfInterest', 'disciplines'];


export function formatIndividualTimeseries(timeseries): any {
  const timeseriesLinked = cloneDeep(timeseries);
  timeseriesLinked['@type'] = 'Timeseries';
  timeseriesLinked.hasObservations = `${config.api.base}/timeseries/${timeseries.id}/observations`;
  const renamed = renameProperties(timeseriesLinked, {
    id: '@id',
    firstObs: 'startDate',
    lastObs: 'endDate',
    hostedByPath: 'ancestorPlatforms'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
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