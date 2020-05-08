import Ajv from 'ajv';
import {cloneDeep} from 'lodash';
import * as check from 'check-types';
import {InvalidBody} from '../../errors/InvalidBody';
import {InvalidResponseBody} from '../../errors/InvalidResponseBody';
import * as logger from 'node-logger';

// deployment
import * as deploymentCreateRequestBodySchema from './json-schemas/deployment-create-request-body.json';
import * as deploymentGetResponseBodySchema from './json-schemas/deployment-get-response.body.json';
// platform
import * as platformGetResponseBodySchema from './json-schemas/platform-get-response-body.json';
import * as platformCreateRequestBodySchema from './json-schemas/platform-create-request-body.json';
import * as platformsGetResponseBodySchema from './json-schemas/platforms-get-response-body.json';
// sensor
import * as sensorCreateRequestBodySchema from './json-schemas/sensor-create-request-body.json';
import * as sensorGetResponseBodySchema from './json-schemas/sensor-get-response-body.json';
import * as sensorsGetResponseBodySchema from './json-schemas/sensors-get-response.body.json';
// timeseries
import * as timeseries from './json-schemas/timeseries.json';
import * as singleTimeseriesGetResponseBodySchema from './json-schemas/single-timeseries-get-response-body.json';
import * as multipleTimeseriesGetResponseBodySchema from './json-schemas/multiple-timeseries-get-response-body.json';
// timeseries observations
import * as timeseriesObservationsGetResponseBody from './json-schemas/timeseries-observations-get-response-body.json';
// procedures
import * as procedureCreateRequestBodySchema from './json-schemas/procedure-create-request-body.json';
import * as procedureUpdateRequestBodySchema from './json-schemas/procedure-update-request-body.json';
import * as procedureGetResponseBodySchema from './json-schemas/procedure-get-response-body.json';
// other
import * as collectionMetaSchema from './json-schemas/collection-meta.json';
import * as contextArraySchema from './json-schemas/context-array.json';



// This is the bit that should be at the start of the $id for all your schemas
const baseSchemaUri = `https://api.birminghamurbanobservatory.com/schemas/`;

// The real benefit of loading all my schemas together here is being able to link them to one another, see:
// https://www.npmjs.com/package/ajv#combining-schemas-with-ref
// It makes use of the $id property.


const ajv = new Ajv({
  useDefaults: true, // lets you specify defaults for properties in the schemas
  schemas: [
    deploymentCreateRequestBodySchema,
    deploymentGetResponseBodySchema,
    platformGetResponseBodySchema,
    platformCreateRequestBodySchema,
    platformsGetResponseBodySchema,
    sensorCreateRequestBodySchema,
    sensorGetResponseBodySchema,
    sensorsGetResponseBodySchema,
    timeseries,
    singleTimeseriesGetResponseBodySchema,
    multipleTimeseriesGetResponseBodySchema,
    timeseriesObservationsGetResponseBody,
    procedureCreateRequestBodySchema,
    procedureUpdateRequestBodySchema,
    procedureGetResponseBodySchema,
    collectionMetaSchema,
    contextArraySchema
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
    let errorMessage = ajv.errorsText(validate.errors);

    if (nameOfSchema.includes('request-body')) {
      // If the request body included a property we weren't expecting, then by default the error text won't include the name of this additional property, however it is available via the validate.errors object, so let's get it.
      // @ts-ignore
      if (check.nonEmptyArray(validate.errors) && validate.errors[0].keyword === 'additionalProperties' && validate.errors[0].params && check.nonEmptyString(validate.errors[0].params.additionalProperty)) {
        // @ts-ignore
        errorMessage += ` (additional property: '${validate.errors[0].params.additionalProperty}')`;
      } 
      throw new InvalidBody(errorMessage);

    } else if (nameOfSchema.includes('response-body')) {
      throw new InvalidResponseBody(undefined, errorMessage);

    } else {
      throw new Error(errorMessage);
    }
  }

}