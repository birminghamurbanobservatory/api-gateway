import {CollectionOptions} from '../common/collection-options.class';
import * as featureOfInterestService from './feature-of-interest.service';
import {createFeatureOfInterestResponse, createFeaturesOfInterestResponse} from './feature-of-interest.formatter';



export async function getFeatureOfInterest(featureOfInterestId: string): Promise<any> {

  const featureOfInterest = await featureOfInterestService.getFeatureOfInterest(featureOfInterestId);
  const featureOfInterestWithContext = createFeatureOfInterestResponse(featureOfInterest);
  return featureOfInterestWithContext;

}




export async function getFeaturesOfInterest(where, options: CollectionOptions): Promise<any> {

  const {featuresOfInterest, count, total} = await featureOfInterestService.getFeaturesOfInterest(where, options);
  const featuresOfInterestWithContext = createFeaturesOfInterestResponse(featuresOfInterest, {count, total});
  return featuresOfInterestWithContext;

}