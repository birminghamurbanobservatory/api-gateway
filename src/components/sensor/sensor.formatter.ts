import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';



export function formatSensorForClient(sensor: object): object {
  const forClient = cloneDeep(sensor);
  const ordered = orderObjectKeys(forClient, ['id', 'name', 'description', 'permanentHost']);
  return ordered;
}


export function formatSensorAsLinkedData(sensor: any): any {
  const sensorLinked = cloneDeep(sensor);
  sensorLinked['@id'] = sensorLinked.id;
  delete sensorLinked.id;
  sensorLinked['@type'] = 'Sensor';
  return sensorLinked;
}


export function addContextToSensor(sensor: any): object {

  const sensorWithContext = formatSensorAsLinkedData(sensor);

  sensorWithContext['@context'] = [
    contextLinks.sensor
  ];

  const ordered = orderObjectKeys(sensorWithContext, ['@context', '@id', 'name', 'description', 'permanentHost']);
  return ordered;

}


export function addContextToSensors(sensors: any[]): object {

  const sensorsLd = sensors.map(formatSensorAsLinkedData);

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
  };

  return sensorsWithContext;

}