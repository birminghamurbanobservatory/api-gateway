import * as event from 'event-stream';
import * as unknownSensorService from './unknown-sensor.service';
import {formatUnknownSensorForClient} from './unknown-sensor.formatter';
import {PaginationOptions} from '../common/pagination-options.class';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';


export async function getUnknownSensors(options: PaginationOptions): Promise<any> {

  const {unknownSensors, totalCount} = await unknownSensorService.getUnknownSensors(options);
  const unknownSensorsForClient = unknownSensors.map(formatUnknownSensorForClient);
  
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
    member: unknownSensorsForClient,
    meta: {
      totalCount
    }
  };

  return unknownSensorsWithContext;

}



