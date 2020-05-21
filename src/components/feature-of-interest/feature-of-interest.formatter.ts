import {cloneDeep, omit} from 'lodash';
import orderObjectKeys from '../../utils/order-object-keys';
import {contextLinks} from '../context/context.service';
import {config} from '../../config';
import {renameProperties} from '../../utils/rename';

const keyOrder = ['@context', '@id', '@type', 'label', 'comment', 'listed', 'belongsToDeployment', 'inCommonVocab', 'location', 'centroid', 'createdAt', 'updatedAt'];
const locationKeyOrder = ['id', 'type', 'geometry', 'properties'];
const geometryKeyOrder = ['type', 'coordinates'];


export function formatIndividualFeatureOfInterest(featureOfInterest: any): any {
  const featureOfInterestLinked = cloneDeep(featureOfInterest);
  featureOfInterestLinked['@type'] = 'FeatureOfInterest';
  // For now at least I don't want the end users seeing who created the featureOfInterest
  delete featureOfInterestLinked.createdBy;

  // Rearrange the location so it forms valid GeoJSON objects
  if (featureOfInterestLinked.location) {

    // Build the centroid
    featureOfInterestLinked.centroid = {
      id: featureOfInterestLinked.location.id,
      type: 'Feature',
      geometry: featureOfInterestLinked.location.centroid,
      properties: {
        validAt: featureOfInterestLinked.location.validAt
      }
    };
    if (featureOfInterestLinked.location.height) {
      featureOfInterestLinked.centroid.properties.height = featureOfInterestLinked.location.height;
    }

    featureOfInterestLinked.centroid = orderObjectKeys(featureOfInterestLinked.centroid, locationKeyOrder);
    featureOfInterestLinked.centroid.geometry = orderObjectKeys(featureOfInterestLinked.centroid.geometry, geometryKeyOrder);

    // Build the location
    featureOfInterestLinked.location.type = 'Feature';
    featureOfInterestLinked.location.properties = {
      validAt: featureOfInterestLinked.location.validAt
    };
    if (featureOfInterestLinked.location.height) {
      featureOfInterestLinked.location.properties.height = featureOfInterestLinked.location.height;
    }
    featureOfInterestLinked.location = orderObjectKeys(featureOfInterestLinked.location, locationKeyOrder);
    featureOfInterestLinked.location.geometry = orderObjectKeys(featureOfInterestLinked.location.geometry, geometryKeyOrder);

    // clear some properties
    delete featureOfInterestLinked.location.height;
    delete featureOfInterestLinked.location.validAt;
    delete featureOfInterestLinked.location.centroid;
    // reorder

    featureOfInterestLinked.location = orderObjectKeys(featureOfInterestLinked.location, ['id', 'type', 'geometry', 'properties']);  
  }

  const renamed = renameProperties(featureOfInterestLinked, {
    id: '@id'
  });
  const ordered = orderObjectKeys(renamed, keyOrder);
  return ordered;
}

export function formatIndividualFeatureOfInterestCondensed(featureOfInterest: any): object {
  const linked = formatIndividualFeatureOfInterest(featureOfInterest);
  // Pull out the properties we don't need
  const removableProps = ['listed', 'inCommonVocab', 'createdAt', 'updatedAt'];
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