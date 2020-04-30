import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {config} from '../../config';
import {contextLinks} from '../context/context.service';
import {getUnitsObject, getDisciplinesObject, getObservablePropertiesObject} from '../vocab/vocab.service';

// Decided to keep these formatting functions separate from the functions that call the event-stream. This makes testing easier because I can mock the whole event-stream-calling-module without also mocking these formatting functions too.
// Were I not to do this, and I tried to get test the /observations endpoint, I would not only end up mocking the event-stream response but also the formatObservationForClient function which would return undefined by default, and thus no observations would actually be returned.

// N.B. for now at least, we just load these once on startup, using the local backup rather than the live common UO vocabularly. Feels like a safer and more efficient approach for now.
const unitsObject = getUnitsObject();
const disciplinesObject = getDisciplinesObject();
const observablePropertiesObject = getObservablePropertiesObject();


const keyOrder = ['@context', '@id', '@type', 'resultTime', 'hasResult', 'madeBySensor', 'inTimeseries', 'observedProperty', 'hasFeatureOfInterest', 'hasDeployment', 'ancestorPlatforms', 'location'];


export function formatIndividualObservation(observation: any): any {

  const observationLinked = cloneDeep(observation);
  observationLinked['@id'] = observationLinked.id;
  delete observationLinked.id;
  observationLinked['@type'] = 'Observation';

  if (observationLinked.hostedByPath) {
    observationLinked.ancestorPlatforms = observationLinked.hostedByPath;
  }
  delete observationLinked.hostedByPath;

  if (observationLinked.timeseriesId) {
    observationLinked.inTimeseries = observationLinked.timeseriesId;
  }
  delete observationLinked.timeseriesId;

  if (observationLinked.hasResult.unit) {
    const unitId = observationLinked.hasResult.unit;
    if (unitsObject[unitId]) {
      observationLinked.hasResult.unit = {
        '@id': unitsObject[unitId].idNoPrefix, // we can use @base in a context file to add the base url for this.
        label: unitsObject[unitId].label,
        symbol: unitsObject[unitId].symbol
      };
    } else {
      // Would end up here if we can't find a matching unit in our vocabularly, figured it was better to return something rather than throwing an error.
      observationLinked.hasResult.unit = {'@id': unitId};
    }
  }

  if (observationLinked.observedProperty) {
    const observedPropertyId = observationLinked.observedProperty;
    if (observablePropertiesObject[observedPropertyId]) {
      observationLinked.observedProperty = {
        '@id': observablePropertiesObject[observedPropertyId].idNoPrefix,
        label: observablePropertiesObject[observedPropertyId].label
      };
    } else {
      observationLinked.observedProperty = {'@id': observedPropertyId};
    }
  }

  if (observationLinked.disciplines) {
    observationLinked.disciplines = observationLinked.disciplines.map((disciplineId): any => {
      if (disciplinesObject[disciplineId]) {
        return {
          '@id': disciplinesObject[disciplineId].idNoPrefix,
          label: disciplinesObject[disciplineId].label
        };
      } else {
        return {'@id': disciplineId};
      }
    });
  }

  if (observationLinked.location) {
    observationLinked.location.properties = {
      validAt: observationLinked.location.validAt
    };
    delete observationLinked.location.validAt;
    observationLinked.location.type = 'Feature';
    observationLinked.location = orderObjectKeys(observationLinked.location, ['type', 'id', 'geometry', 'properties']);
  }

  const ordered = orderObjectKeys(observationLinked, keyOrder);
  return ordered;
}


export function createObservationResponse(sensor: any): object {

  const observationWithContext = formatIndividualObservation(sensor);

  observationWithContext['@context'] = [
    contextLinks.observation
  ];

  const ordered = orderObjectKeys(observationWithContext, keyOrder);
  return ordered;

}


export function createObservationsResponse(observations: any[], extraInfo: {count: number; total?: number}): object {

  const observationsLd = observations.map(formatIndividualObservation);

  const observationsWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.observation
    ],
    '@id': `${config.api.base}/observations`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: observationsLd,
    meta: extraInfo
  };

  return observationsWithContext;

}








