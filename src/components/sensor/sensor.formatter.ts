import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';

const keyOrder = ['@context', '@id', '@type', 'name', 'description', 'permanentHost', 'initialConfig', 'currentConfig', 'createdAt', 'updatedAt'];


export function formatIndividualSensor(sensor: any): any {
  const sensorLinked = cloneDeep(sensor);
  sensorLinked['@id'] = sensorLinked.id;
  delete sensorLinked.id;
  sensorLinked['@type'] = 'Sensor';
  const ordered = orderObjectKeys(sensorLinked, keyOrder);
  return ordered;
}

export function formatIndividualSensorCondensed(sensor: any): object {
  const linked = formatIndividualSensor(sensor);
  // Pull out the properties we don't need
  const removableProps = ['description', 'permanentHost', 'initialConfig', 'currentConfig', 'hasDeployment', 'isHostedBy', 'createdAt', 'updatedAt'];
  const condensed = omit(linked, removableProps);
  return condensed;
}


export function createSensorResponse(sensor: any): object {

  const sensorWithContext = formatIndividualSensor(sensor);

  sensorWithContext['@context'] = [
    contextLinks.sensor
  ];

  const ordered = orderObjectKeys(sensorWithContext, keyOrder);
  return ordered;

}


export function createSensorsResponse(sensors: any[], extraInfo: {count: number; total: number}): object {

  const sensorsLd = sensors.map(formatIndividualSensor);

  const sensorsWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.sensor
    ],
    '@id': `${config.api.base}/sensors`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: sensorsLd,
    meta: extraInfo
  };

  return sensorsWithContext;

}