import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';

const keyOrder = ['@context', '@id', '@type', 'resultTime', 'hasResult'];

const unnecessaryKeys = ['timeseriesId', 'madeBySensor', 'hasDeployment', 'hostedByPath', 'hasFeatureOfInterest', 'observedProperty', 'disciplines', 'usedProcedures'];


export function formatIndividualTimeseriesObservation(observation): any {

  const observationLinked = cloneDeep(observation);

  observationLinked['@id'] = observationLinked.id;
  delete observationLinked.id;
  observationLinked['@type'] = 'Observation';

  if (observationLinked.location) {
    observationLinked.location.properties = {
      validAt: observationLinked.location.validAt
    };
    delete observationLinked.location.validAt;
    if (observationLinked.location.height) {
      observationLinked.location.properties.height = observationLinked.location.height;
    }
    delete observationLinked.location.height;
    observationLinked.location.type = 'Feature';
    observationLinked.location = orderObjectKeys(observationLinked.location, ['type', 'id', 'geometry', 'properties']);
  }

  // Could potentially remove this bit because the data should already be condenced from the observations-manager.
  const condensed = omit(observationLinked, unnecessaryKeys);
  delete condensed.hasResult.unit;

  const ordered = orderObjectKeys(condensed, keyOrder);
  return ordered;
}



export function createTimeseriesObservationsResponse(observations: any[], timeseriesId, extraInfo: {count: number; total?: number}): object {

  const observationsLd = observations.map(formatIndividualTimeseriesObservation);

  const observationsWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.observation
    ],
    '@id': `${config.api.base}/timeseries/${timeseriesId}/observations`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: observationsLd,
    meta: extraInfo
  };

  return observationsWithContext;

}