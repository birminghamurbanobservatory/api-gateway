import * as joi from '@hapi/joi';
import {cloneDeep} from 'lodash';
import * as check from 'check-types';

// The GeoJSON type structure that clients provide new locations in differs slightly from what's used on the backend, e.g. by the sensor-deployment-manager
const locationSchema = joi.object({
  geometry: joi.object().required(),
  properties: joi.object()
}).required();

export function locationClientToApp(clientLocation: any): any {

  const {error: err} = locationSchema.validate(clientLocation);
  if (err) throw new Error(`Invalid client location. Reason: ${err.message}`);  

  const appLocation = cloneDeep(clientLocation);
  
  if (clientLocation.properties && check.assigned(clientLocation.properties.height)) {
    appLocation.height = clientLocation.properties.height;
  }

  delete appLocation.properties;

  return appLocation;

}