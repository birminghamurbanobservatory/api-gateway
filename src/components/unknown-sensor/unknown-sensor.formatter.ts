import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {config} from '../../config';
import {contextLinks} from '../context/context.service';

const keyOrder = ['@context', '@id', 'nObservations', 'lastObservation', 'createdAt', 'updatedAt'];


export function formatIndividualUnknownSensor(unknownSensor: any): object {
  const unknownSensorLinked = cloneDeep(unknownSensor);
  unknownSensorLinked['@id'] = unknownSensorLinked.id;
  delete unknownSensorLinked.id;
  const ordered = orderObjectKeys(unknownSensorLinked, keyOrder);
  return ordered;
}


export function createUnknownSensorResponse(unknownSensor: any): object {

  const unknownSensorWithContext = formatIndividualUnknownSensor(unknownSensor);

  unknownSensorWithContext['@context'] = [
    contextLinks.unknownSensor
  ];

  const ordered = orderObjectKeys(unknownSensorWithContext, keyOrder);
  return ordered;

}


export function createUnknownSensorsResponse(unknownSensors: any[], extraInfo: {total: number; count: number}): object {

  const unknownSensorsLd = unknownSensors.map(formatIndividualUnknownSensor);

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
      count: extraInfo.count,
      total: extraInfo.total
    }
  };

  return unknownSensorsWithContext;

}