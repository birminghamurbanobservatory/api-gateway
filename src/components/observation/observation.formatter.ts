import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {config} from '../../config';
import {contextLinks} from '../context/context.service';

// Decided to keep these formatting functions separate from the functions that call the event-stream. This makes testing easier because I can mock the whole event-stream-calling-module without also mocking these formatting functions too.
// Were I not to do this, and I tried to get test the /observations endpoint, I would not only end up mocking the event-stream response but also the formatObservationForClient function which would return undefined by default, and thus no observations would actually be returned.



export function formatObservationForClient(observation: object): object {

  const forClient = cloneDeep(observation);

  if (forClient.hostedByPath) {
    forClient.ancestorPlatform = forClient.hostedByPath;
  }
  delete forClient.hostedByPath;

  if (forClient.hasResult.flags) {
    forClient.hasResult.flag = forClient.hasResult.flags;
  }
  delete forClient.hasResult.flags;

  const ordered = orderObjectKeys(forClient, ['id', 'resultTime', 'hasResult', 'madeBySensor', 'observedProperty', 'hasFeatureOfInterest', 'inDeployment', 'isHostedBy']);
  return ordered;

}


export function formatObservationAsLinkedData(observation: any): object {

  const apiBase = config.api.base;

  const observationLinked = cloneDeep(observation);
  observationLinked['@id'] = observationLinked.id;
  delete observationLinked.id;
  observationLinked['@type'] = 'Observation';

  if (observationLinked.inDeployments) {
    observationLinked.inDeployment = observationLinked.inDeployments;
    delete observationLinked.inDeployments;
  }

  if (observationLinked.hostedByPath) {
    observationLinked.ancestorPlatform = observationLinked.hostedByPath;
  }
  delete observationLinked.hostedByPath;

  const ordered = orderObjectKeys(observationLinked, ['@id', '@type', 'resultTime', 'hasResult', 'madeBySensor', 'observedProperty', 'hasFeatureOfInterest', 'inDeployment', 'ancestorPlatform']);
  return ordered;

}



export function addContextToObservation(observation: object): object {

  const observationWithContext = formatObservationAsLinkedData(observation);

  observationWithContext['@context'] = [
    contextLinks.observation
  ];

  const ordered = orderObjectKeys(observationWithContext, ['@context', '@id', 'resultTime', 'hasResult', 'madeBySensor', 'observedProperty', 'hasFeatureOfInterest', 'inDeployment', 'isHostedBy']);
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

  return observationsWithContext;

}


