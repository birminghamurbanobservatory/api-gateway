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


export function formatObservationForClient(observation: object): object {

  const forClient = cloneDeep(observation);

  if (forClient.hostedByPath) {
    forClient.ancestorPlatforms = forClient.hostedByPath;
    delete forClient.hostedByPath;
  }

  const ordered = orderObjectKeys(forClient, ['id', 'resultTime', 'hasResult', 'madeBySensor', 'observedProperty', 'hasFeatureOfInterest', 'inDeployments', 'ancestorPlatforms']);
  return ordered;

}


export function formatObservationAsLinkedData(observation: any): object {

  const observationLinked = cloneDeep(observation);
  observationLinked['@id'] = observationLinked.id;
  delete observationLinked.id;
  observationLinked['@type'] = 'Observation';

  if (observationLinked.hostedByPath) {
    observationLinked.ancestorPlatforms = observationLinked.hostedByPath;
  }
  delete observationLinked.hostedByPath;

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

  const ordered = orderObjectKeys(observationLinked, ['@id', '@type', 'resultTime', 'hasResult', 'madeBySensor', 'observedProperty', 'disciplines', 'hasFeatureOfInterest', 'inDeployments', 'ancestorPlatforms']);
  return ordered;

}



export function addContextToObservation(observation: object): object {

  const observationWithContext = formatObservationAsLinkedData(observation);

  observationWithContext['@context'] = [
    contextLinks.observation
  ];

  const ordered = orderObjectKeys(observationWithContext, ['@context', '@id', 'resultTime', 'hasResult', 'madeBySensor', 'observedProperty', 'hasFeatureOfInterest', 'inDeployments', 'ancestorPlatforms']);
  return ordered;
  
}



export function addContextToObservations(observations: any[], extraInfo: any): object {

  const observationsLd = observations.map(formatObservationAsLinkedData);

  const observationsWithContext: any = {
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
    meta: {}
    // TODO: Should the next property inside this meta object be an object, e.g. with a @id property for the actual link, but also a breakdown of the query string parameters, e.g. offset: 10. This can make it easier for front end applications to build their own links.
    // TODO: For the next link we may want to incorporate a resultTime
  };

  if (extraInfo.total) {
    observationsWithContext.meta.total = extraInfo.total;
  }
  if (extraInfo.count) {
    observationsWithContext.meta.count = extraInfo.count;
  }

  return observationsWithContext;

}


