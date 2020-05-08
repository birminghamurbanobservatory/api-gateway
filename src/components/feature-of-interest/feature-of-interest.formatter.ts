import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {renameProperties} from '../../utils/rename';

const keyOrder = ['@context', '@id', '@type', 'label', 'comment', 'listed', 'belongsToDeployment', 'inCommonVocab', 'createdAt', 'updatedAt'];


export function formatIndividualFeatureOfInterest(featureOfInterest: any): any {
  const featureOfInterestLinked = cloneDeep(featureOfInterest);
  featureOfInterestLinked['@type'] = 'FeatureOfInterest';
  // For now at least I don't want the end users seeing who created the featureOfInterest
  delete featureOfInterestLinked.createdBy;
  const renamed = renameProperties(featureOfInterestLinked, {
    id: '@id'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
  return ordered;
}

export function formatIndividualFeatureOfInterestCondensed(featureOfInterest: any): object {
  const linked = formatIndividualFeatureOfInterest(featureOfInterest);
  // Pull out the properties we don't need
  const removableProps = [];
  const condensed = omit(linked, removableProps);
  return condensed;
}


export function createFeatureOfInterestResponse(featureOfInterest: any): object {

  const featureOfInterestWithContext = formatIndividualFeatureOfInterest(featureOfInterest);

  featureOfInterestWithContext['@context'] = [
    contextLinks.featureOfInterest
  ];

  const ordered = orderObjectKeys(featureOfInterestWithContext, keyOrder);
  return ordered;

}


export function createFeaturesOfInterestResponse(featuresOfInterest: any[], extraInfo: {count: number; total: number}): object {

  const featuresOfInterestLd = featuresOfInterest.map(formatIndividualFeatureOfInterest);

  const featuresOfInterestWithContext = {
    '@context': [
      contextLinks.collection,
      contextLinks.featureOfInterest
    ],
    '@id': `${config.api.base}/features-of-interest`, // better defining this in the router?
    '@type': [
      'Collection'
      // TODO: Any more types to add in here?
    ], 
    member: featuresOfInterestLd,
    meta: extraInfo
  };

  return featuresOfInterestWithContext;

}