import * as event from 'event-stream';
import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';

export async function createSensor(sensor): Promise<any> {

  const createdSensor = await event.publishExpectingResponse('sensor.create.request',  {
    new: sensor
  });
  return createdSensor;

}


export async function getSensor(sensorId): Promise<any> {
  const sensor = await event.publishExpectingResponse('sensor.get.request', {
    where: {
      id: sensorId
    }
  }); 
  return sensor;
}


export async function getSensors(where): Promise<any> {
  const sensors = await event.publishExpectingResponse('sensors.get.request', {
    where
  }); 
  return sensors;
}


export function formatSensorForClient(sensor: object): object {
  const forClient = cloneDeep(sensor);
  const ordered = orderObjectKeys(forClient, ['id', 'name', 'description', 'permanentHost']);
  return ordered;
}