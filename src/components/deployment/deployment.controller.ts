import * as event from 'event-stream';

// TODO: might end up adding an options argument in here, e.g. to include the userId, or to filter by public deployments only
export async function getDeployments(): Promise<any> {
  
  const deployments = await event.publishExpectingResponse('deployments.get.request');
  return deployments;

}

export async function getDeployment(deploymentId): Promise<any> {
  const deployment = await event.publishExpectingResponse('deployment.get.request', {id: deploymentId});
  return deployment;
}