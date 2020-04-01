import Ajv from 'ajv';
import {cloneDeep} from 'lodash';
import * as check from 'check-types';

import * as deploymentCreateRequestBodySchema from '../components/deployment/schemas/deployment-create-request-body.json';
import * as deploymentGetResponseBodySchema from '../components/deployment/schemas/deployment-get-response.body.json';
import {InvalidBody} from '../errors/InvalidBody';
import {InvalidResponseBody} from '../errors/InvalidResponseBody';


// This is the bit that should be at the start of the $id for all your schemas
const baseSchemaUri = `https://api.birminghamurbanobservatory.com/schemas/`;


// The real benefit of loading all my schemas together here is being able to link them to one another, see:
// https://www.npmjs.com/package/ajv#combining-schemas-with-ref
// It makes use of the $id property.


const ajv = new Ajv({
  useDefaults: true,
  schemas: [
    deploymentCreateRequestBodySchema,
    deploymentGetResponseBodySchema
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