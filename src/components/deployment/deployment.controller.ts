import * as event from 'event-stream';
import * as check from 'check-types';
import {Forbidden} from '../../errors/Forbidden';

// TODO: might end up adding an options argument in here, e.g. to include the userId, or to filter by public deployments only
export async function getDeployments(): Promise<any> {
  
  const deployments = await event.publishExpectingResponse('deployments.get.request');
  return deployments;

}

export async function getDeployment(deploymentId: string): Promise<any> {
  const deployment = await event.publishExpectingResponse('deployment.get.request', {
    where: {
      id: deploymentId
    }
  });
  return deployment;
}


export async function createDeployment(deployment): Promise<any> {
  const createdDeployment = await event.publishExpectingResponse('deployment.create.request',  {
    new: deployment
  });
  return createdDeployment;
}


export async function checkRightsToDeployment(deploymentId: string, userId?: string): Promise<any> {

  let right;

  const message: any = {
    where: {
      deployment: deploymentId
    }
  };
  if (check.nonEmptyString(userId)) {
    message.where.user = userId;
  }

  try {
    right = await event.publishExpectingResponse('right.get.request', message);
  } catch (err) {
    if (err.name === 'RightNotFound') {
      // TODO: could have an even more specific custom error here?
      throw new Forbidden(`You do not have rights to the ${deploymentId} deployment`);
    } else {
      throw err;
    }
  }

  return right;

}