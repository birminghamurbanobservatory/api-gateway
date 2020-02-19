import * as event from 'event-stream';
import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';


export async function getUnknownSensors(): Promise<any> {
  const unknownSensors = await event.publishExpectingResponse('unknown-sensors.get.request'); 
  return unknownSensors;
}


export function formatUnknownSensorForClient(unknownSensor: object): object {
  const forClient = cloneDeep(unknownSensor);
  const ordered = orderObjectKeys(forClient, ['id', 'nObservations', 'lastObservation']);
  return ordered;
}
