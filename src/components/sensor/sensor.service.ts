import * as event from 'event-stream';
import {CollectionOptions} from '../common/collection-options.class';


export async function createSensor(sensor): Promise<any> {
  const createdSensor = await event.publishExpectingResponse('sensor.create.request',  {
    new: sensor
  });
  return createdSensor;
}


export async function getSensor(sensorId, options: {includeDeleted?: boolean} = {}): Promise<any> {
  const sensor = await event.publishExpectingResponse('sensor.get.request', {
    where: {
      id: sensorId
    },
    options
  }); 
  return sensor;
}


export async function getSensors(where, options: CollectionOptions): Promise<any> {
  const response = await event.publishExpectingResponse('sensors.get.request', {
    where,
    options
  }); 
  return {
    sensors: response.data,
    count: response.meta.count,
    total: response.meta.total
  };
}


export async function updateSensor(id: string, updates: any): Promise<any> {
  const updatedSensor = await event.publishExpectingResponse('sensor.update.request',  {
    where: {
      id
    },
    updates
  });
  return updatedSensor;
}


export async function deleteSensor(id: string): Promise<void> {
  await event.publishExpectingResponse('sensor.delete.request', {
    where: {
      id
    }
  });
  return;
}



