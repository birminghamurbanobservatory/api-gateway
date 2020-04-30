import * as unknownSensorService from './unknown-sensor.service';
import {createUnknownSensorsResponse} from './unknown-sensor.formatter';
import {CollectionOptions} from '../common/collection-options.class';
import {permissionsCheck} from '../common/permissions-check';
import {ApiUser} from '../common/api-user.class';


export async function getUnknownSensors(where, options: CollectionOptions, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'get:unknown-sensor');

  const {unknownSensors, count, total} = await unknownSensorService.getUnknownSensors(where, options);
  const unknownSensorsWithContext = createUnknownSensorsResponse(unknownSensors, {total, count});
  return unknownSensorsWithContext;

}



