import * as unknownSensorService from './unknown-sensor.service';
import {formatUnknownSensorForClient, addContextToUnknownSensors} from './unknown-sensor.formatter';
import {PaginationOptions} from '../common/pagination-options.class';
import {permissionsCheck} from '../common/permissions-check';
import {ApiUser} from '../common/api-user.class';


export async function getUnknownSensors(options: PaginationOptions, user: ApiUser): Promise<any> {

  permissionsCheck(user, 'get:unknown-sensor');

  const {unknownSensors, totalCount} = await unknownSensorService.getUnknownSensors(options);
  const unknownSensorsForClient = unknownSensors.map(formatUnknownSensorForClient);
  // TODO: this step of adding context may have to be moved to the router, so that we know what querystring parameters to add in order to construct the next URL, unless we can figure it out from the options argument.
  const unknownSensorsWithContext = addContextToUnknownSensors(unknownSensorsForClient, {totalCount});
  return unknownSensorsWithContext;

}



