import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';


export function formatUnknownSensorForClient(unknownSensor: object): object {
  const forClient = cloneDeep(unknownSensor);
  const ordered = orderObjectKeys(forClient, ['id', 'nObservations', 'lastObservation']);
  return ordered;
}