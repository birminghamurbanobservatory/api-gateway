import {cloneDeep} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {config} from '../../config';

// Decided to keep these formatting functions separate from the functions that call the event-stream. This makes testing easier because I can mock the whole event-stream-calling-module without also mocking these formatting functions too.
// Were I not to do this, and I tried to get test the /observations endpoint, I would not only end up mocking the event-stream response but also the formatObservationForClient function which would return undefined by default, and thus no observations would actually be returned.




export function formatObservationForClient(observation: object): object {

  const apiBase = config.api.base;

  const forClient = cloneDeep(observation);
  forClient['@id'] = forClient.id;
  delete forClient.id;
  forClient['@type'] = 'Observation';

  forClient.madeBySensor = `${apiBase}/sensors/${forClient.madeBySensor}`;

  if (forClient.inDeployments) {
    forClient.inDeployment = forClient.inDeployments.map((deploymentId): string => {
      return `${apiBase}/deployments/${deploymentId}`;
    });
    delete forClient.inDeployments;
  }

  if (forClient.hostedByPath) {
    forClient.isHostedBy = forClient.hostedByPath.map((platformId): string => {
      return `${apiBase}/platforms/${platformId}`;
    });
  }
  delete forClient.hostedByPath;

  const ordered = orderObjectKeys(forClient, ['@id', 'resultTime', 'hasResult', 'madeBySensor', 'observedProperty', 'hasFeatureOfInterest', 'inDeployment', 'isHostedBy']);
  return ordered;

}