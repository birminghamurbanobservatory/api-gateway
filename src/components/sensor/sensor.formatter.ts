import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';


export function formatSensorForApp(fromClient): object {
  const forApp = cloneDeep(fromClient);
  if (forApp.initialConfig) {
    forApp.initialConfig = forApp.initialConfig.map(formatSensorConfigForApp);
  }
  if (forApp.currentConfig) {
    forApp.currentConfig = forApp.currentConfig.map(formatSensorConfigForApp);
  }
  return forApp;
}

export function formatSensorConfigForApp(fromClient): object {
  const forApp = cloneDeep(fromClient);
  if (forApp.discipline) {
    forApp.disciplines = forApp.discipline;
    delete forApp.discipline;
  }
  if (forApp.usedProcedure) {
    forApp.usedProcedures = forApp.usedProcedure;
    delete forApp.usedProcedure;
  }
  return forApp;
}


export function formatSensorConfigForClient(fromApp): object {
  const forClient = cloneDeep(fromApp);
  if (forClient.disciplines) {
    forClient.discipline = forClient.disciplines;
    delete forClient.disciplines;
  }
  if (forClient.usedProcedures) {
    forClient.usedProcedure = forClient.usedProcedures;
    delete forClient.usedProcedures;
  }
  return forClient;
}


export function formatSensorForClient(sensor: object): object {
  const forClient = cloneDeep(sensor);
  if (forClient.initialConfig) {
    forClient.initialConfig = forClient.initialConfig.map(formatSensorConfigForClient);
  }
  if (forClient.currentConfig) {
    forClient.currentConfig = forClient.currentConfig.map(formatSensorConfigForClient);
  }
  const ordered = orderObjectKeys(forClient, ['id', 'name', 'description', 'permanentHost']);
  return ordered;
}


export function formatSensorAsLinkedData(sensor: any): object {
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