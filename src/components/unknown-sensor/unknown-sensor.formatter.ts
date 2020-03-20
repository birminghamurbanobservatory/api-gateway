import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {config} from '../../config';
import {contextLinks} from '../context/context.service';


export function formatUnknownSensorForClient(unknownSensor: object): object {
  const forClient = cloneDeep(unknownSensor);
  const ordered = orderObjectKeys(forClient, ['id', 'nObservations', 'lastObservation']);
  return ordered;
}


export function formatUnknownSensorAsLinkedData(unknownSensor: any): object {
  const unknownSensorLinked = cloneDeep(unknownSensor);
  unknownSensorLinked['@id'] = unknownSensorLinked.id;
  delete unknownSensorLinked.id;
  return unknownSensorLinked;
}



export function addContextToUnknownSensor(unknownSensor: any): object {

  const unknownSensorWithContext = formatUnknownSensorAsLinkedData(unknownSensor);

  unknownSensorWithContext['@context'] = [
    contextLinks.unknownSensor
  ];

  const ordered = orderObjectKeys(unknownSensorWithContext, ['@context', '@id', 'nObservations', 'lastObservation']);
  return ordered;

}



export function addContextToUnknownSensors(unknownSensors: any[], extraInfo: {totalCount: number}): object {

  const unknownSensorsLd = unknownSensors.map(formatUnknownSensorAsLinkedData);

  const unknownSensorsWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.unknownSensor
    ],
    '@id': `${config.api.base}/unknown-sensors`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: unknownSensorsLd,
    meta: {
      totalCount: extraInfo.totalCount
    }
  };

  return unknownSensorsWithContext;

}