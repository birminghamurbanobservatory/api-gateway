import Ajv from 'ajv';
import {cloneDeep} from 'lodash';
import * as check from 'check-types';
import {InvalidBody} from '../../errors/InvalidBody';
import {InvalidResponseBody} from '../../errors/InvalidResponseBody';
import * as logger from 'node-logger';

import * as deploymentCreateRequestBodySchema from './json-schemas/deployment-create-request-body.json';
import * as deploymentGetResponseBodySchema from './json-schemas/deployment-get-response.body.json';
import * as platformGetResponseBodySchema from './json-schemas/platform-get-response-body.json';
import * as platformCreateRequestBodySchema from './json-schemas/platform-create-request-body.json';
import * as platformsGetResponseBodySchema from './json-schemas/platforms-get-response-body.json';
import * as sensorCreateRequestBodySchema from './json-schemas/sensor-create-request-body.json';
import * as sensorGetResponseBodySchema from './json-schemas/sensor-get-response-body.json';
import * as sensorsGetResponseBodySchema from './json-schemas/sensors-get-response.body.json';


// This is the bit that should be at the start of the $id for all your schemas
const baseSchemaUri = `https://api.birminghamurbanobservatory.com/schemas/`;

// The real benefit of loading all my schemas together here is being able to link them to one another, see:
// https://www.npmjs.com/package/ajv#combining-schemas-with-ref
// It makes use of the $id property.


const ajv = new Ajv({
  useDefaults: true,
  schemas: [
    deploymentCreateRequestBodySchema,
    deploymentGetResponseBodySchema,
    platformGetResponseBodySchema,
    platformCreateRequestBodySchema,
    platformsGetResponseBodySchema,
    sensorCreateRequestBodySchema,
    sensorGetResponseBodySchema,
    sensorsGetResponseBodySchema
  ]
});


// I've put a wrapper around ajv's getSchema function so that I don't have to include the long base of the $id, and .json extension, each time I need to get a schema in my controllers/routers.
export function getSchema(importantBitOfId: string): any {
  const fullId = `${baseSchemaUri}${importantBitOfId}.json`;
  return ajv.getSchema(fullId); 
}


export function validateAgainstSchema(data: any, nameOfSchema: string): any {

  const fullId = `${baseSchemaUri}${nameOfSchema}.json`;
  const validate = ajv.getSchema(fullId);

  // If validate is not a function then it means that the schema name provided could not be found
  if (check.not.function(validate)) {
    throw new Error(`Unable to find a json schema with $id of: ${fullId}`);
  }

  const dataClone = cloneDeep(data); // so that defaults can be safely applied.
  const isValid = validate(dataClone);
  if (isValid) {
    return dataClone; // any defaults will have been applied to this.
  } else {
    logger.warn(validate.errors);
    const errorMessage = ajv.errorsText(validate.errors);
    if (nameOfSchema.includes('request-body')) {
      throw new InvalidBody(errorMessage);
    } else if (nameOfSchema.includes('response-body')) {
      throw new InvalidResponseBody(undefined, errorMessage);
    } else {
      throw new Error(errorMessage);
    }
  }

}