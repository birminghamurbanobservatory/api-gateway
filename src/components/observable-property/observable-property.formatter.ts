import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {renameProperties} from '../../utils/rename';

const keyOrder = ['@context', '@id', '@type', 'label', 'comment', 'listed', 'belongsToDeployment', 'inCommonVocab', 'createdAt', 'updatedAt'];


export function formatIndividualObservableProperty(observableProperty: any): any {
  const observablePropertyLinked = cloneDeep(observableProperty);
  observablePropertyLinked['@type'] = 'ObservableProperty';
  // For now at least I don't want the end users seeing who created the observableProperty
  delete observablePropertyLinked.createdBy;
  const renamed = renameProperties(observablePropertyLinked, {
    id: '@id'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
  return ordered;
}

export function formatIndividualObservablePropertyCondensed(observableProperty: any): object {
  const linked = formatIndividualObservableProperty(observableProperty);
  // Pull out the properties we don't need
  const removableProps = ['listed', 'inCommonVocab', 'units', 'createdAt', 'updatedAt'];
  const condensed = omit(linked, removableProps);
  return condensed;
}


export function createObservablePropertyResponse(observableProperty: any): object {

  const observablePropertyWithContext = formatIndividualObservableProperty(observableProperty);

  observablePropertyWithContext['@context'] = [
    contextLinks.observableProperty
  ];

  const ordered = orderObjectKeys(observablePropertyWithContext, keyOrder);
  return ordered;

}


export function createObservablePropertiesResponse(observableProperties: any[], extraInfo: {count: number; total: number}): object {

  const observablePropertiesLd = observableProperties.map(formatIndividualObservableProperty);

  const observablePropertiesWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.observableProperty
    ],
    '@id': `${config.api.base}/observable-properties`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: observablePropertiesLd,
    meta: extraInfo
  };

  return observablePropertiesWithContext;

}