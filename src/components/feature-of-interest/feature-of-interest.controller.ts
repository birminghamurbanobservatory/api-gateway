import * as event from 'event-stream';

export async function createFeatureOfInterest(featureOfInterest): Promise<any> {

  const createdFeatureOfInterest = await event.publishExpectingResponse('feature-of-interest.create.request',  {
    new: featureOfInterest
  });
  return createdFeatureOfInterest;

}


export async function getFeatureOfInterest(featureOfInterestId): Promise<any> {
  const featureOfInterest = await event.publishExpectingResponse('feature-of-interest.get.request', {
    where: {
      id: featureOfInterestId
    }
  }); 
  return featureOfInterest;
}


export async function getFeaturesOfInterest(): Promise<any> {
  const featuresOfInterest = await event.publishExpectingResponse('features-of-interest.get.request'); 
  return featuresOfInterest;
}