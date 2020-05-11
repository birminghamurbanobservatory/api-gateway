import Ajv from 'ajv';
import {cloneDeep} from 'lodash';
import * as check from 'check-types';
import {InvalidBody} from '../../errors/InvalidBody';
import {InvalidResponseBody} from '../../errors/InvalidResponseBody';
import * as logger from 'node-logger';

// deployment
import * as deploymentSchema from './json-schemas/deployment.json';
import * as deploymentsGetResponseBodySchema from './json-schemas/deployments-get-response-body.json';
import * as deploymentCreateRequestBodySchema from './json-schemas/deployment-create-request-body.json';
import * as deploymentUpdateRequestBodySchema from './json-schemas/deployment-update-request-body.json';
import * as deploymentGetResponseBodySchema from './json-schemas/deployment-get-response-body.json';
// platform
import * as platformGetResponseBodySchema from './json-schemas/platform-get-response-body.json';
import * as platformCreateRequestBodySchema from './json-schemas/platform-create-request-body.json';
import * as platformsGetResponseBodySchema from './json-schemas/platforms-get-response-body.json';
// sensor
import * as sensorCreateRequestBodySchema from './json-schemas/sensor-create-request-body.json';
import * as sensorGetResponseBodySchema from './json-schemas/sensor-get-response-body.json';
import * as sensorsGetResponseBodySchema from './json-schemas/sensors-get-response.body.json';
// observations
import * as observationSchema from './json-schemas/observation.json';
import * as observationGetReponseBodySchema from './json-schemas/observation-get-response-body.json';
import * as observationsGetReponseBodySchema from './json-schemas/observations-get-response-body.json';
// timeseries
import * as timeseriesSchema from './json-schemas/timeseries.json';
import * as singleTimeseriesGetResponseBodySchema from './json-schemas/single-timeseries-get-response-body.json';
import * as multipleTimeseriesGetResponseBodySchema from './json-schemas/multiple-timeseries-get-response-body.json';
// timeseries observations
import * as timeseriesObservationsGetResponseBody from './json-schemas/timeseries-observations-get-response-body.json';
// procedures
import * as procedureSchema from './json-schemas/procedure.json';
import * as proceduresGetResponseBodySchema from './json-schemas/procedures-get-response-body.json';
import * as procedureCreateRequestBodySchema from './json-schemas/procedure-create-request-body.json';
import * as procedureUpdateRequestBodySchema from './json-schemas/procedure-update-request-body.json';
import * as procedureGetResponseBodySchema from './json-schemas/procedure-get-response-body.json';
// observableProperties
import * as observablePropertySchema from './json-schemas/observable-property.json';
import * as observablePropertiesGetResponseBodySchema from './json-schemas/observable-properties-get-response-body.json';
import * as observablePropertyCreateRequestBodySchema from './json-schemas/observable-property-create-request-body.json';
import * as observablePropertyUpdateRequestBodySchema from './json-schemas/observable-property-update-request-body.json';
import * as observablePropertyGetResponseBodySchema from './json-schemas/observable-property-get-response-body.json';
// aggregations
import * as aggregationSchema from './json-schemas/aggregation.json';
import * as aggregationsGetResponseBodySchema from './json-schemas/aggregations-get-response-body.json';
import * as aggregationCreateRequestBodySchema from './json-schemas/aggregation-create-request-body.json';
import * as aggregationUpdateRequestBodySchema from './json-schemas/aggregation-update-request-body.json';
import * as aggregationGetResponseBodySchema from './json-schemas/aggregation-get-response-body.json';
// units
import * as unitSchema from './json-schemas/unit.json';
import * as unitsGetResponseBodySchema from './json-schemas/units-get-response-body.json';
import * as unitCreateRequestBodySchema from './json-schemas/unit-create-request-body.json';
import * as unitUpdateRequestBodySchema from './json-schemas/unit-update-request-body.json';
import * as unitGetResponseBodySchema from './json-schemas/unit-get-response-body.json';
// disciplines
import * as disciplineSchema from './json-schemas/discipline.json';
import * as disciplinesGetResponseBodySchema from './json-schemas/disciplines-get-response-body.json';
import * as disciplineCreateRequestBodySchema from './json-schemas/discipline-create-request-body.json';
import * as disciplineUpdateRequestBodySchema from './json-schemas/discipline-update-request-body.json';
import * as disciplineGetResponseBodySchema from './json-schemas/discipline-get-response-body.json';
// features of interest
import * as featuresOfInterestSchema from './json-schemas/feature-of-interest.json';
import * as featuresOfInterestGetResponseBodySchema from './json-schemas/features-of-interest-get-response-body.json';
import * as featureOfInterestCreateRequestBodySchema from './json-schemas/feature-of-interest-create-request-body.json';
import * as featureOfInterestUpdateRequestBodySchema from './json-schemas/feature-of-interest-update-request-body.json';
import * as featureOfInterestGetResponseBodySchema from './json-schemas/feature-of-interest-get-response-body.json';
// other
import * as locationSchema from './json-schemas/location.json';
import * as centroidSchema from './json-schemas/centroid.json';
import * as collectionMetaSchema from './json-schemas/collection-meta.json';
import * as contextArraySchema from './json-schemas/context-array.json';
import * as errorResponseBody from './json-schemas/error-response-body.json';


// This is the bit that should be at the start of the $id for all your schemas
const baseSchemaUri = `https://api.birminghamurbanobservatory.com/schemas/`;

// The real benefit of loading all my schemas together here is being able to link them to one another, see:
// https://www.npmjs.com/package/ajv#combining-schemas-with-ref
// It makes use of the $id property.


const ajv = new Ajv({
  useDefaults: true, // lets you specify defaults for properties in the schemas
  schemas: [
    // deployments
    deploymentSchema,
    deploymentCreateRequestBodySchema,
    deploymentGetResponseBodySchema,
    deploymentUpdateRequestBodySchema,
    deploymentsGetResponseBodySchema,
    // platforms
    platformGetResponseBodySchema,
    platformCreateRequestBodySchema,
    platformsGetResponseBodySchema,
    // sensors
    sensorCreateRequestBodySchema,
    sensorGetResponseBodySchema,
    sensorsGetResponseBodySchema,
    // observations
    observationSchema,
    observationGetReponseBodySchema,
    observationsGetReponseBodySchema,
    // timeseries
    timeseriesSchema,
    singleTimeseriesGetResponseBodySchema,
    multipleTimeseriesGetResponseBodySchema,
    timeseriesObservationsGetResponseBody,
    // procedure
    procedureSchema,
    proceduresGetResponseBodySchema,
    procedureCreateRequestBodySchema,
    procedureUpdateRequestBodySchema,
    procedureGetResponseBodySchema,
    // observableProperties
    observablePropertySchema,
    observablePropertiesGetResponseBodySchema,
    observablePropertyCreateRequestBodySchema,
    observablePropertyUpdateRequestBodySchema,
    observablePropertyGetResponseBodySchema,
    // aggregations
    aggregationSchema,
    aggregationsGetResponseBodySchema,
    aggregationCreateRequestBodySchema,
    aggregationUpdateRequestBodySchema,
    aggregationGetResponseBodySchema,
    // units
    unitSchema,
    unitsGetResponseBodySchema,
    unitCreateRequestBodySchema,
    unitUpdateRequestBodySchema,
    unitGetResponseBodySchema,
    // disciplines
    disciplineSchema,
    disciplinesGetResponseBodySchema,
    disciplineCreateRequestBodySchema,
    disciplineUpdateRequestBodySchema,
    disciplineGetResponseBodySchema,
    // features of interest
    featuresOfInterestSchema,
    featuresOfInterestGetResponseBodySchema,
    featureOfInterestCreateRequestBodySchema,
    featureOfInterestUpdateRequestBodySchema,
    featureOfInterestGetResponseBodySchema,
    // extras
    locationSchema,
    centroidSchema,
    collectionMetaSchema,
    contextArraySchema,
    errorResponseBody
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