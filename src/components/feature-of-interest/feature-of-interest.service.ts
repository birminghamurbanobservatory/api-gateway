import {CollectionOptions} from '../common/collection-options.class';
import {NotFound} from '../../errors/NotFound';


export async function getFeatureOfInterest(featureOfInterestId): Promise<any> {

  // TODO
  throw new NotFound(`Failed to find a feature of interest with id: ${featureOfInterestId}`);

}



export async function getFeaturesOfInterest(where: {id?: any} = {}, options: CollectionOptions = {}): Promise<any> {

  const featuresOfInterest = [];

  return {
    featuresOfInterest,
    count: featuresOfInterest.length,
    total: 0 // TODO
  };

}
