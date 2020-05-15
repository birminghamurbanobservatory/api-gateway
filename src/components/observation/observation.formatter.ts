import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {config} from '../../config';
import {contextLinks} from '../context/context.service';

// Decided to keep these formatting functions separate from the functions that call the event-stream. This makes testing easier because I can mock the whole event-stream-calling-module without also mocking these formatting functions too.
// Were I not to do this, and I tried to get test the /observations endpoint, I would not only end up mocking the event-stream response but also the formatObservationForClient function which would return undefined by default, and thus no observations would actually be returned.


const keyOrder = ['@context', '@id', '@type', 'resultTime', 'hasResult', 'madeBySensor', 'inTimeseries', 'observedProperty', 'aggregation', 'hasFeatureOfInterest', 'hasDeployment', 'ancestorPlatforms', 'location'];


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

  if (observationLinked.location) {
    observationLinked.location.properties = {
      validAt: observationLinked.location.validAt
    };
    delete observationLinked.location.validAt;
    // If there's a height property, add it as the 3rd element in the observation
    if (observationLinked.location.height) {
      observationLinked.location.geometry.coordinates[2] = observationLinked.location.height;
    }
    delete observationLinked.location.height;
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








