import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {renameProperties} from '../../utils/rename';

const keyOrder = ['@context', '@id', '@type', 'label', 'description', 'listed', 'belongsToDeployment', 'inCommonVocab', 'createdAt', 'updatedAt'];


export function formatIndividualAggregation(aggregation: any): any {
  const aggregationLinked = cloneDeep(aggregation);
  aggregationLinked['@type'] = 'Aggregation';
  // For now at least I don't want the end users seeing who created the aggregation
  delete aggregationLinked.createdBy;
  const renamed = renameProperties(aggregationLinked, {
    id: '@id'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
  return ordered;
}

export function formatIndividualAggregationCondensed(aggregation: any): object {
  const linked = formatIndividualAggregation(aggregation);
  // Pull out the properties we don't need
  const removableProps = ['listed', 'inCommonVocab', 'createdAt', 'updatedAt'];
  const condensed = omit(linked, removableProps);
  return condensed;
}


export function createAggregationResponse(aggregation: any): object {

  const aggregationWithContext = formatIndividualAggregation(aggregation);

  aggregationWithContext['@context'] = [
    contextLinks.aggregation
  ];

  const ordered = orderObjectKeys(aggregationWithContext, keyOrder);
  return ordered;

}


export function createAggregationsResponse(aggregations: any[], extraInfo: {count: number; total: number}): object {

  const aggregationsLd = aggregations.map(formatIndividualAggregation);

  const aggregationsWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.aggregation
    ],
    '@id': `${config.api.base}/aggregations`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: aggregationsLd,
    meta: extraInfo
  };

  return aggregationsWithContext;

}